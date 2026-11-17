"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireRole } from "@/lib/auth";
import { prismaErrorMessage, redirectError, redirectSuccess } from "@/lib/errors";
import { parseDateInput, todayDate } from "@/lib/format";
import { deleteUpload, saveUpload } from "@/lib/uploads";
import { firstIssue, optionalString, passwordField, safeString } from "@/lib/validation";

function idField(value: FormDataEntryValue | null): number | null {
  const id = Number(safeString(value));
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function siswaProfile() {
  const user = await requireRole("siswa");
  if (!user.siswa) {
    redirectError("/siswa/dashboard", "Profil siswa tidak ditemukan. Hubungi admin.");
  }
  return { user, siswa: user.siswa };
}

const pklSchema = z.object({
  guruId: z.number().int().positive().optional(),
  perusahaanId: z.number().int().positive().optional(),
  judul: z.string().trim().min(1, "Judul PKL wajib diisi.").max(255, "Judul maksimal 255 karakter."),
  deskripsi: z.string().trim().max(5000, "Deskripsi terlalu panjang.").optional(),
});

function parseOptionalId(value: FormDataEntryValue | null): number | undefined {
  const raw = safeString(value);
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function pklValues(formData: FormData) {
  return {
    guruId: parseOptionalId(formData.get("guru_id")),
    perusahaanId: parseOptionalId(formData.get("perusahaan_id")),
    judul: safeString(formData.get("judul")),
    deskripsi: optionalString(formData.get("deskripsi")),
  };
}

function validateDates(formData: FormData, back: string) {
  const mulai = parseDateInput(formData.get("tanggal_mulai"));
  const selesai = parseDateInput(formData.get("tanggal_selesai"));
  if (mulai && selesai && selesai < mulai) {
    redirectError(back, "Tanggal selesai tidak boleh sebelum tanggal mulai.");
  }
  return { mulai, selesai };
}

export async function createPklAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const back = "/siswa/pkl/create";
  const parsed = pklSchema.safeParse(pklValues(formData));
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));
  const { mulai, selesai } = validateDates(formData, back);

  try {
    await prisma.pkl.create({
      data: {
        siswaId: siswa.id,
        guruId: parsed.data.guruId,
        perusahaanId: parsed.data.perusahaanId,
        judul: parsed.data.judul,
        deskripsi: parsed.data.deskripsi,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        status: "pengajuan",
      },
    });
  } catch (error) {
    redirectError(back, prismaErrorMessage(error));
  }

  revalidatePath("/siswa/pkl");
  revalidatePath("/siswa/dashboard");
  redirectSuccess("/siswa/pkl", "Pengajuan PKL berhasil dikirim.");
}

async function ownedPkl(pklId: number, siswaId: number, back: string) {
  const pkl = await prisma.pkl.findUnique({ where: { id: pklId } });
  if (!pkl) redirectError(back, "Data PKL tidak ditemukan.");
  if (pkl.siswaId !== siswaId) redirectError(back, "Anda tidak berhak mengubah data PKL ini.");
  return pkl;
}

export async function updatePklAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const id = idField(formData.get("id"));
  const back = id ? `/siswa/pkl/${id}/edit` : "/siswa/pkl";
  if (!id) redirectError("/siswa/pkl", "Data PKL tidak ditemukan.");

  const pkl = await ownedPkl(id, siswa.id, back);
  if (pkl.status !== "pengajuan") {
    redirectError("/siswa/pkl", "PKL yang sudah diproses tidak dapat diubah.");
  }

  const parsed = pklSchema.safeParse(pklValues(formData));
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));
  const { mulai, selesai } = validateDates(formData, back);

  try {
    await prisma.pkl.update({
      where: { id: pkl.id },
      data: {
        guruId: parsed.data.guruId,
        perusahaanId: parsed.data.perusahaanId,
        judul: parsed.data.judul,
        deskripsi: parsed.data.deskripsi,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
      },
    });
  } catch (error) {
    redirectError(back, prismaErrorMessage(error));
  }

  revalidatePath("/siswa/pkl");
  revalidatePath(`/siswa/pkl/${pkl.id}`);
  redirectSuccess("/siswa/pkl", "PKL berhasil diupdate.");
}

export async function uploadLaporanAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const id = idField(formData.get("id"));
  const back = id ? `/siswa/pkl/${id}` : "/siswa/pkl";
  if (!id) redirectError("/siswa/pkl", "Data PKL tidak ditemukan.");
  const pkl = await ownedPkl(id, siswa.id, back);

  const file = formData.get("laporan_akhir");
  if (!(file instanceof File) || file.size === 0) {
    redirectError(back, "File laporan akhir wajib dipilih.");
  }

  let stored: string;
  try {
    stored = await saveUpload(file, "laporan", `laporan_${pkl.id}`, "pdf");
  } catch (error) {
    redirectError(back, prismaErrorMessage(error));
  }

  try {
    await prisma.pkl.update({ where: { id: pkl.id }, data: { laporanAkhir: stored } });
  } catch (error) {
    await deleteUpload(stored);
    redirectError(back, prismaErrorMessage(error));
  }
  await deleteUpload(pkl.laporanAkhir);

  revalidatePath(back);
  revalidatePath("/siswa/pkl");
  redirectSuccess(back, "Laporan akhir berhasil diupload.");
}

const jurnalSchema = z.object({
  pklId: z.coerce.number().int().positive("PKL wajib dipilih."),
  kegiatan: z.string().trim().min(1, "Kegiatan wajib diisi.").max(10000, "Kegiatan terlalu panjang."),
});

async function validateJurnalDates(formData: FormData, back: string) {
  const tanggal = parseDateInput(formData.get("tanggal"));
  if (!tanggal) redirectError(back, "Tanggal jurnal wajib diisi dengan format yang benar.");
  return tanggal;
}

async function ownedJurnal(jurnalId: number, siswaId: number, back: string) {
  const jurnal = await prisma.jurnal.findUnique({ where: { id: jurnalId }, include: { pkl: true } });
  if (!jurnal) redirectError(back, "Data jurnal tidak ditemukan.");
  if (jurnal.pkl.siswaId !== siswaId) redirectError(back, "Anda tidak berhak mengakses jurnal ini.");
  return jurnal;
}

export async function createJurnalAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const back = "/siswa/jurnal/create";
  const parsed = jurnalSchema.safeParse({
    pklId: safeString(formData.get("pkl_id")),
    kegiatan: safeString(formData.get("kegiatan")),
  });
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));
  const tanggal = await validateJurnalDates(formData, back);

  const pkl = await ownedPkl(parsed.data.pklId, siswa.id, back);
  if (!["disetujui", "selesai"].includes(pkl.status)) {
    redirectError(back, "Jurnal hanya dapat ditambahkan pada PKL yang sudah disetujui.");
  }

  let dokumentasi: string | undefined;
  const file = formData.get("dokumentasi");
  if (file instanceof File && file.size > 0) {
    try {
      dokumentasi = await saveUpload(file, "dokumentasi", `dokumentasi_${pkl.id}`, "image");
    } catch (error) {
      redirectError(back, prismaErrorMessage(error));
    }
  }

  try {
    await prisma.jurnal.create({
      data: {
        pklId: pkl.id,
        tanggal,
        kegiatan: parsed.data.kegiatan,
        dokumentasi,
      },
    });
  } catch (error) {
    await deleteUpload(dokumentasi);
    redirectError(back, prismaErrorMessage(error));
  }

  revalidatePath("/siswa/jurnal");
  revalidatePath("/siswa/dashboard");
  redirectSuccess("/siswa/jurnal", "Jurnal berhasil ditambahkan.");
}

export async function updateJurnalAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const id = idField(formData.get("id"));
  const back = id ? `/siswa/jurnal/${id}/edit` : "/siswa/jurnal";
  if (!id) redirectError("/siswa/jurnal", "Data jurnal tidak ditemukan.");
  const jurnal = await ownedJurnal(id, siswa.id, back);

  const parsed = jurnalSchema.safeParse({
    pklId: safeString(formData.get("pkl_id")),
    kegiatan: safeString(formData.get("kegiatan")),
  });
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));
  const tanggal = await validateJurnalDates(formData, back);
  await ownedPkl(parsed.data.pklId, siswa.id, back);

  let dokumentasi: string | undefined;
  const file = formData.get("dokumentasi");
  if (file instanceof File && file.size > 0) {
    try {
      dokumentasi = await saveUpload(file, "dokumentasi", `dokumentasi_${jurnal.pklId}`, "image");
    } catch (error) {
      redirectError(back, prismaErrorMessage(error));
    }
  }

  try {
    await prisma.jurnal.update({
      where: { id: jurnal.id },
      data: {
        pklId: parsed.data.pklId,
        tanggal,
        kegiatan: parsed.data.kegiatan,
        ...(dokumentasi ? { dokumentasi } : {}),
      },
    });
  } catch (error) {
    await deleteUpload(dokumentasi);
    redirectError(back, prismaErrorMessage(error));
  }

  if (dokumentasi) await deleteUpload(jurnal.dokumentasi);

  revalidatePath("/siswa/jurnal");
  redirectSuccess("/siswa/jurnal", "Jurnal berhasil diupdate.");
}

export async function deleteJurnalAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const id = idField(formData.get("id"));
  if (!id) redirectError("/siswa/jurnal", "Data jurnal tidak ditemukan.");
  const jurnal = await ownedJurnal(id, siswa.id, "/siswa/jurnal");

  try {
    await prisma.jurnal.delete({ where: { id: jurnal.id } });
  } catch (error) {
    redirectError("/siswa/jurnal", prismaErrorMessage(error));
  }
  await deleteUpload(jurnal.dokumentasi);

  revalidatePath("/siswa/jurnal");
  redirectSuccess("/siswa/jurnal", "Jurnal berhasil dihapus.");
}

const absensiSchema = z.object({
  status: z.enum(["hadir", "sakit", "izin", "alpha"], {
    errorMap: () => ({ message: "Status absensi tidak valid." }),
  }),
  keterangan: z.string().trim().max(2000, "Keterangan terlalu panjang.").optional(),
});

export async function createAbsensiAction(formData: FormData): Promise<never> {
  const { siswa } = await siswaProfile();
  const back = "/siswa/absensi/create";
  const parsed = absensiSchema.safeParse({
    status: safeString(formData.get("status")),
    keterangan: optionalString(formData.get("keterangan")),
  });
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));

  const today = todayDate();
  const existing = await prisma.absensi.findUnique({
    where: { siswaId_tanggal: { siswaId: siswa.id, tanggal: today } },
  });
  if (existing) redirectError("/siswa/absensi", "Anda sudah absen hari ini.");

  try {
    await prisma.absensi.create({
      data: {
        siswaId: siswa.id,
        tanggal: today,
        status: parsed.data.status,
        keterangan: parsed.data.keterangan,
      },
    });
  } catch (error) {
    redirectError("/siswa/absensi", prismaErrorMessage(error));
  }

  revalidatePath("/siswa/absensi");
  redirectSuccess("/siswa/absensi", "Absensi berhasil dicatat.");
}

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi.").max(255, "Nama maksimal 255 karakter."),
    noTelp: z.string().trim().max(20, "No. telp maksimal 20 karakter.").optional(),
    alamat: z.string().trim().max(2000, "Alamat terlalu panjang.").optional(),
    password: z.string().max(255).optional(),
    passwordConfirmation: z.string().optional(),
  })
  .refine(
    (value) =>
      !value.password ||
      (value.password.length >= 8 && value.password === value.passwordConfirmation),
    { message: "Password minimal 8 karakter dan konfirmasi harus sama.", path: ["password"] },
  );

export async function updateProfilAction(formData: FormData): Promise<never> {
  const { user, siswa } = await siswaProfile();
  const back = "/siswa/profil";
  const parsed = profileSchema.safeParse({
    name: safeString(formData.get("name")),
    noTelp: optionalString(formData.get("no_telp")),
    alamat: optionalString(formData.get("alamat")),
    password: optionalString(formData.get("password")),
    passwordConfirmation: optionalString(formData.get("password_confirmation")),
  });
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));

  let foto: string | undefined;
  const file = formData.get("foto");
  if (file instanceof File && file.size > 0) {
    try {
      foto = await saveUpload(file, "foto", `foto_${user.id}`, "image");
    } catch (error) {
      redirectError(back, prismaErrorMessage(error));
    }
  }

  const data: {
    name: string;
    noTelp?: string;
    alamat?: string;
    foto?: string;
    password?: string;
  } = { name: parsed.data.name, noTelp: parsed.data.noTelp, alamat: parsed.data.alamat };
  if (foto) data.foto = foto;
  if (parsed.data.password) data.password = await hashPassword(parsed.data.password);

  try {
    await prisma.user.update({ where: { id: user.id }, data });
  } catch (error) {
    await deleteUpload(foto);
    redirectError(back, prismaErrorMessage(error));
  }
  if (foto) await deleteUpload(user.foto);

  revalidatePath(back);
  revalidatePath("/siswa/dashboard");
  redirectSuccess(back, "Profil berhasil diupdate.");
}

