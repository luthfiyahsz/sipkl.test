"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireRole } from "@/lib/auth";
import { prismaErrorMessage, redirectError, redirectSuccess } from "@/lib/errors";
import {
  emailField,
  firstIssue,
  nameField,
  optionalString,
  passwordField,
  safeString,
} from "@/lib/validation";

function idField(value: FormDataEntryValue | null): number | null {
  const id = Number(safeString(value));
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function run<T>(path: string, success: string, work: () => Promise<T>): Promise<never> {
  try {
    await work();
  } catch (error) {
    redirectError(path, prismaErrorMessage(error));
  }
  revalidatePath(path);
  redirectSuccess(path, success);
}

const personBase = z.object({
  name: nameField,
  email: emailField,
  noTelp: z.string().trim().max(20, "No. telp maksimal 20 karakter.").optional(),
  alamat: z.string().trim().max(2000, "Alamat terlalu panjang.").optional(),
});

const siswaCreateSchema = personBase.extend({
  nis: z.string().trim().min(1, "NIS wajib diisi.").max(20, "NIS maksimal 20 karakter."),
  kelas: z.string().trim().max(10, "Kelas maksimal 10 karakter.").optional(),
  password: passwordField,
});

const siswaUpdateSchema = personBase.extend({
  nis: z.string().trim().min(1, "NIS wajib diisi.").max(20, "NIS maksimal 20 karakter."),
  kelas: z.string().trim().max(10, "Kelas maksimal 10 karakter.").optional(),
  password: z.string().max(255).optional(),
});

function personValues(formData: FormData) {
  return {
    name: safeString(formData.get("name")),
    email: safeString(formData.get("email")),
    noTelp: optionalString(formData.get("no_telp")),
    alamat: optionalString(formData.get("alamat")),
  };
}

export async function createSiswaAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const raw = {
    ...personValues(formData),
    nis: safeString(formData.get("nis")),
    kelas: optionalString(formData.get("kelas")),
    password: safeString(formData.get("password")),
  };
  const parsed = siswaCreateSchema.safeParse(raw);
  if (!parsed.success) {
    redirectError("/admin/siswa/create", firstIssue(parsed.error));
  }

  return run("/admin/siswa", "Siswa berhasil ditambahkan.", async () => {
    const password = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password,
          role: "siswa",
          noTelp: parsed.data.noTelp,
          alamat: parsed.data.alamat,
          active: true,
        },
      });
      await tx.siswa.create({
        data: {
          userId: user.id,
          nis: parsed.data.nis,
          kelas: parsed.data.kelas,
        },
      });
    });
  });
}

export async function updateSiswaAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  const back = id ? `/admin/siswa/${id}/edit` : "/admin/siswa";
  if (!id) {
    redirectError("/admin/siswa", "Data siswa tidak ditemukan.");
  }

  const raw = {
    ...personValues(formData),
    nis: safeString(formData.get("nis")),
    kelas: optionalString(formData.get("kelas")),
    password: optionalString(formData.get("password")) ?? "",
  };
  const parsed = siswaUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirectError(back, firstIssue(parsed.error));
  }

  return run("/admin/siswa", "Siswa berhasil diupdate.", async () => {
    const siswa = await prisma.siswa.findUnique({ where: { id } });
    if (!siswa) throw new Error("Data siswa tidak ditemukan.");
    const userData: {
      name: string;
      email: string;
      noTelp?: string;
      alamat?: string;
      password?: string;
    } = {
      name: parsed.data.name,
      email: parsed.data.email,
      noTelp: parsed.data.noTelp,
      alamat: parsed.data.alamat,
    };
    if (parsed.data.password) userData.password = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: siswa.userId }, data: userData }),
      prisma.siswa.update({
        where: { id: siswa.id },
        data: { nis: parsed.data.nis, kelas: parsed.data.kelas },
      }),
    ]);
  });
}

export async function deleteSiswaAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  if (!id) {
    redirectError("/admin/siswa", "Data siswa tidak ditemukan.");
  }
  return run("/admin/siswa", "Siswa berhasil dihapus.", async () => {
    const siswa = await prisma.siswa.findUnique({ where: { id } });
    if (!siswa) throw new Error("Data siswa tidak ditemukan.");
    await prisma.user.delete({ where: { id: siswa.userId } });
  });
}

const guruCreateSchema = personBase.extend({
  nip: z.string().trim().min(1, "NIP wajib diisi.").max(20, "NIP maksimal 20 karakter."),
  gelar: z.string().trim().max(50, "Gelar maksimal 50 karakter.").optional(),
  password: passwordField,
});

const guruUpdateSchema = personBase.extend({
  nip: z.string().trim().min(1, "NIP wajib diisi.").max(20, "NIP maksimal 20 karakter."),
  gelar: z.string().trim().max(50, "Gelar maksimal 50 karakter.").optional(),
  password: z.string().max(255).optional(),
});

export async function createGuruAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const raw = {
    ...personValues(formData),
    nip: safeString(formData.get("nip")),
    gelar: optionalString(formData.get("gelar")),
    password: safeString(formData.get("password")),
  };
  const parsed = guruCreateSchema.safeParse(raw);
  if (!parsed.success) {
    redirectError("/admin/guru/create", firstIssue(parsed.error));
  }

  return run("/admin/guru", "Guru berhasil ditambahkan.", async () => {
    const password = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password,
          role: "guru",
          noTelp: parsed.data.noTelp,
          alamat: parsed.data.alamat,
          active: true,
        },
      });
      await tx.guru.create({
        data: { userId: user.id, nip: parsed.data.nip, gelar: parsed.data.gelar },
      });
    });
  });
}

export async function updateGuruAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  const back = id ? `/admin/guru/${id}/edit` : "/admin/guru";
  if (!id) {
    redirectError("/admin/guru", "Data guru tidak ditemukan.");
  }

  const raw = {
    ...personValues(formData),
    nip: safeString(formData.get("nip")),
    gelar: optionalString(formData.get("gelar")),
    password: optionalString(formData.get("password")) ?? "",
  };
  const parsed = guruUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirectError(back, firstIssue(parsed.error));
  }

  return run("/admin/guru", "Guru berhasil diupdate.", async () => {
    const guru = await prisma.guru.findUnique({ where: { id } });
    if (!guru) throw new Error("Data guru tidak ditemukan.");
    const userData: {
      name: string;
      email: string;
      noTelp?: string;
      alamat?: string;
      password?: string;
    } = {
      name: parsed.data.name,
      email: parsed.data.email,
      noTelp: parsed.data.noTelp,
      alamat: parsed.data.alamat,
    };
    if (parsed.data.password) userData.password = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: guru.userId }, data: userData }),
      prisma.guru.update({
        where: { id: guru.id },
        data: { nip: parsed.data.nip, gelar: parsed.data.gelar },
      }),
    ]);
  });
}

export async function deleteGuruAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  if (!id) {
    redirectError("/admin/guru", "Data guru tidak ditemukan.");
  }
  return run("/admin/guru", "Guru berhasil dihapus.", async () => {
    const guru = await prisma.guru.findUnique({ where: { id } });
    if (!guru) throw new Error("Data guru tidak ditemukan.");
    await prisma.user.delete({ where: { id: guru.userId } });
  });
}

const perusahaanCreateSchema = personBase.extend({
  kontakPerson: z.string().trim().max(100, "Kontak person maksimal 100 karakter.").optional(),
  website: z.string().trim().max(255, "Website maksimal 255 karakter.").url("Format website tidak valid.").optional(),
  password: passwordField,
});

const perusahaanUpdateSchema = personBase.extend({
  kontakPerson: z.string().trim().max(100, "Kontak person maksimal 100 karakter.").optional(),
  website: z.string().trim().max(255, "Website maksimal 255 karakter.").url("Format website tidak valid.").optional(),
  password: z.string().max(255).optional(),
});

export async function createPerusahaanAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const raw = {
    ...personValues(formData),
    kontakPerson: optionalString(formData.get("kontak_person")),
    website: optionalString(formData.get("website")),
    password: safeString(formData.get("password")),
  };
  const parsed = perusahaanCreateSchema.safeParse(raw);
  if (!parsed.success) {
    redirectError("/admin/perusahaan/create", firstIssue(parsed.error));
  }

  return run("/admin/perusahaan", "Perusahaan berhasil ditambahkan.", async () => {
    const password = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password,
          role: "perusahaan",
          noTelp: parsed.data.noTelp,
          alamat: parsed.data.alamat,
          active: true,
        },
      });
      await tx.perusahaan.create({
        data: {
          userId: user.id,
          kontakPerson: parsed.data.kontakPerson,
          website: parsed.data.website,
        },
      });
    });
  });
}

export async function updatePerusahaanAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  const back = id ? `/admin/perusahaan/${id}/edit` : "/admin/perusahaan";
  if (!id) {
    redirectError("/admin/perusahaan", "Data perusahaan tidak ditemukan.");
  }

  const raw = {
    ...personValues(formData),
    kontakPerson: optionalString(formData.get("kontak_person")),
    website: optionalString(formData.get("website")),
    password: optionalString(formData.get("password")) ?? "",
  };
  const parsed = perusahaanUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirectError(back, firstIssue(parsed.error));
  }

  return run("/admin/perusahaan", "Perusahaan berhasil diupdate.", async () => {
    const perusahaan = await prisma.perusahaan.findUnique({ where: { id } });
    if (!perusahaan) throw new Error("Data perusahaan tidak ditemukan.");
    const userData: {
      name: string;
      email: string;
      noTelp?: string;
      alamat?: string;
      password?: string;
    } = {
      name: parsed.data.name,
      email: parsed.data.email,
      noTelp: parsed.data.noTelp,
      alamat: parsed.data.alamat,
    };
    if (parsed.data.password) userData.password = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: perusahaan.userId }, data: userData }),
      prisma.perusahaan.update({
        where: { id: perusahaan.id },
        data: { kontakPerson: parsed.data.kontakPerson, website: parsed.data.website },
      }),
    ]);
  });
}

export async function deletePerusahaanAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  if (!id) {
    redirectError("/admin/perusahaan", "Data perusahaan tidak ditemukan.");
  }
  return run("/admin/perusahaan", "Perusahaan berhasil dihapus.", async () => {
    const perusahaan = await prisma.perusahaan.findUnique({ where: { id } });
    if (!perusahaan) throw new Error("Data perusahaan tidak ditemukan.");
    await prisma.user.delete({ where: { id: perusahaan.userId } });
  });
}

const pklUpdateSchema = z.object({
  status: z.enum(["pengajuan", "disetujui", "ditolak", "selesai"], {
    errorMap: () => ({ message: "Status PKL tidak valid." }),
  }),
  catatan: z.string().trim().max(5000, "Catatan terlalu panjang.").optional(),
});

export async function updatePklStatusAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  if (!id) {
    redirectError("/admin/pkl", "Data PKL tidak ditemukan.");
  }
  const parsed = pklUpdateSchema.safeParse({
    status: safeString(formData.get("status")),
    catatan: optionalString(formData.get("catatan")),
  });
  if (!parsed.success) {
    redirectError(`/admin/pkl/${id}/edit`, firstIssue(parsed.error));
  }

  return run("/admin/pkl", "Status PKL berhasil diupdate.", async () => {
    await prisma.pkl.update({
      where: { id },
      data: { status: parsed.data.status, catatan: parsed.data.catatan },
    });
  });
}

export async function deletePklAction(formData: FormData): Promise<never> {
  await requireRole("admin");
  const id = idField(formData.get("id"));
  if (!id) {
    redirectError("/admin/pkl", "Data PKL tidak ditemukan.");
  }
  return run("/admin/pkl", "PKL berhasil dihapus.", async () => {
    await prisma.pkl.delete({ where: { id } });
  });
}
