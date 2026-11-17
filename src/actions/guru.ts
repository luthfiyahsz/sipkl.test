"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { prismaErrorMessage, redirectError, redirectSuccess } from "@/lib/errors";
import { firstIssue, optionalString, safeString } from "@/lib/validation";

function idField(value: FormDataEntryValue | null): number | null {
  const id = Number(safeString(value));
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function guruProfile() {
  const user = await requireRole("guru");
  if (!user.guru) {
    redirectError("/guru/dashboard", "Profil guru tidak ditemukan. Hubungi admin.");
  }
  return { user, guru: user.guru };
}

/** Pastikan jurnal berada pada PKL yang dibimbing guru yang sedang login. */
async function ownedJurnal(jurnalId: number, guruId: number) {
  const jurnal = await prisma.jurnal.findUnique({
    where: { id: jurnalId },
    include: { pkl: { select: { guruId: true } } },
  });
  if (!jurnal) redirectError("/guru/jurnal", "Data jurnal tidak ditemukan.");
  if (jurnal.pkl.guruId !== guruId) {
    redirectError("/guru/jurnal", "Anda tidak berhak memproses jurnal ini.");
  }
  return jurnal;
}

export async function approveJurnalAction(formData: FormData): Promise<never> {
  const { guru } = await guruProfile();
  const id = idField(formData.get("id"));
  if (!id) redirectError("/guru/jurnal", "Data jurnal tidak ditemukan.");
  const jurnal = await ownedJurnal(id, guru.id);

  try {
    await prisma.jurnal.update({
      where: { id: jurnal.id },
      data: { statusDosen: "disetujui" },
    });
  } catch (error) {
    redirectError(`/guru/jurnal/${id}`, prismaErrorMessage(error));
  }

  revalidatePath(`/guru/jurnal/${id}`);
  revalidatePath("/guru/jurnal");
  revalidatePath("/guru/dashboard");
  redirectSuccess(`/guru/jurnal/${id}`, "Jurnal berhasil disetujui.");
}

const komentarSchema = z.object({
  komentar: z
    .string()
    .trim()
    .min(1, "Komentar wajib diisi.")
    .max(5000, "Komentar terlalu panjang."),
});

export async function commentJurnalAction(formData: FormData): Promise<never> {
  const { guru } = await guruProfile();
  const id = idField(formData.get("id"));
  if (!id) redirectError("/guru/jurnal", "Data jurnal tidak ditemukan.");
  const jurnal = await ownedJurnal(id, guru.id);

  const parsed = komentarSchema.safeParse({
    komentar: safeString(formData.get("komentar_dosen")),
  });
  if (!parsed.success) redirectError(`/guru/jurnal/${id}`, firstIssue(parsed.error));

  try {
    await prisma.jurnal.update({
      where: { id: jurnal.id },
      data: { komentarDosen: parsed.data.komentar },
    });
  } catch (error) {
    redirectError(`/guru/jurnal/${id}`, prismaErrorMessage(error));
  }

  revalidatePath(`/guru/jurnal/${id}`);
  revalidatePath("/guru/jurnal");
  redirectSuccess(`/guru/jurnal/${id}`, "Komentar berhasil ditambahkan.");
}

export async function rejectJurnalAction(formData: FormData): Promise<never> {
  const { guru } = await guruProfile();
  const id = idField(formData.get("id"));
  if (!id) redirectError("/guru/jurnal", "Data jurnal tidak ditemukan.");
  const jurnal = await ownedJurnal(id, guru.id);

  const parsed = komentarSchema.safeParse({
    komentar: safeString(formData.get("komentar_dosen")),
  });
  if (!parsed.success) {
    redirectError(`/guru/jurnal/${id}`, `Alasan penolakan wajib diisi.`);
  }

  try {
    await prisma.jurnal.update({
      where: { id: jurnal.id },
      data: { statusDosen: "ditolak", komentarDosen: parsed.data.komentar },
    });
  } catch (error) {
    redirectError(`/guru/jurnal/${id}`, prismaErrorMessage(error));
  }

  revalidatePath(`/guru/jurnal/${id}`);
  revalidatePath("/guru/jurnal");
  revalidatePath("/guru/dashboard");
  redirectSuccess(`/guru/jurnal/${id}`, "Jurnal ditolak.");
}

const scoreField = z.coerce
  .number({ invalid_type_error: "Nilai harus berupa angka." })
  .int("Nilai harus bilangan bulat.")
  .min(0, "Nilai minimal 0.")
  .max(100, "Nilai maksimal 100.");

const penilaianSchema = z.object({
  pklId: z.coerce.number().int().positive("PKL tidak valid."),
  nilaiKedisiplinan: scoreField,
  nilaiKerjasama: scoreField,
  nilaiPengetahuan: scoreField,
  nilaiKeterampilan: scoreField,
  nilaiLaporan: scoreField,
  komentar: z.string().trim().max(5000, "Komentar terlalu panjang.").optional(),
});

function penilaianValues(formData: FormData) {
  return {
    pklId: safeString(formData.get("pkl_id")),
    nilaiKedisiplinan: safeString(formData.get("nilai_kedisiplinan")),
    nilaiKerjasama: safeString(formData.get("nilai_kerjasama")),
    nilaiPengetahuan: safeString(formData.get("nilai_pengetahuan")),
    nilaiKeterampilan: safeString(formData.get("nilai_keterampilan")),
    nilaiLaporan: safeString(formData.get("nilai_laporan")),
    komentar: optionalString(formData.get("komentar")),
  };
}

function averageScore(values: {
  nilaiKedisiplinan: number;
  nilaiKerjasama: number;
  nilaiPengetahuan: number;
  nilaiKeterampilan: number;
  nilaiLaporan: number;
}): number {
  const total =
    values.nilaiKedisiplinan +
    values.nilaiKerjasama +
    values.nilaiPengetahuan +
    values.nilaiKeterampilan +
    values.nilaiLaporan;
  return Math.round(total / 5);
}

export async function savePenilaianAction(formData: FormData): Promise<never> {
  const { guru } = await guruProfile();
  const parsed = penilaianSchema.safeParse(penilaianValues(formData));
  const back = "/guru/penilaian";
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));

  const pkl = await prisma.pkl.findUnique({ where: { id: parsed.data.pklId } });
  if (!pkl) redirectError(back, "Data PKL tidak ditemukan.");
  if (pkl.guruId !== guru.id) {
    redirectError(back, "Anda tidak berhak menilai PKL ini.");
  }

  const scores = {
    nilaiKedisiplinan: parsed.data.nilaiKedisiplinan,
    nilaiKerjasama: parsed.data.nilaiKerjasama,
    nilaiPengetahuan: parsed.data.nilaiPengetahuan,
    nilaiKeterampilan: parsed.data.nilaiKeterampilan,
    nilaiLaporan: parsed.data.nilaiLaporan,
    totalNilai: averageScore(parsed.data),
    komentar: parsed.data.komentar,
  };

  try {
    const existing = await prisma.penilaian.findFirst({
      where: { pklId: pkl.id, guruId: guru.id },
      select: { id: true },
    });
    if (existing) {
      await prisma.penilaian.update({ where: { id: existing.id }, data: scores });
    } else {
      await prisma.penilaian.create({
        data: { pklId: pkl.id, guruId: guru.id, perusahaanId: pkl.perusahaanId, ...scores },
      });
    }
  } catch (error) {
    redirectError(back, prismaErrorMessage(error));
  }

  revalidatePath("/guru/penilaian");
  revalidatePath("/guru/dashboard");
  revalidatePath("/admin/penilaian");
  redirectSuccess(back, "Penilaian berhasil disimpan.");
}

export async function updatePenilaianAction(formData: FormData): Promise<never> {
  const { guru } = await guruProfile();
  const id = idField(formData.get("id"));
  const back = id ? `/guru/penilaian/${id}/edit` : "/guru/penilaian";
  if (!id) redirectError("/guru/penilaian", "Data penilaian tidak ditemukan.");

  const penilaian = await prisma.penilaian.findUnique({ where: { id } });
  if (!penilaian) redirectError("/guru/penilaian", "Data penilaian tidak ditemukan.");
  if (penilaian.guruId !== guru.id) {
    redirectError("/guru/penilaian", "Anda tidak berhak mengubah penilaian ini.");
  }

  const raw = penilaianValues(formData);
  const parsed = penilaianSchema.safeParse({ ...raw, pklId: penilaian.pklId });
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));

  try {
    await prisma.penilaian.update({
      where: { id: penilaian.id },
      data: {
        nilaiKedisiplinan: parsed.data.nilaiKedisiplinan,
        nilaiKerjasama: parsed.data.nilaiKerjasama,
        nilaiPengetahuan: parsed.data.nilaiPengetahuan,
        nilaiKeterampilan: parsed.data.nilaiKeterampilan,
        nilaiLaporan: parsed.data.nilaiLaporan,
        totalNilai: averageScore(parsed.data),
        komentar: parsed.data.komentar,
      },
    });
  } catch (error) {
    redirectError(back, prismaErrorMessage(error));
  }

  revalidatePath("/guru/penilaian");
  revalidatePath("/admin/penilaian");
  redirectSuccess("/guru/penilaian", "Penilaian berhasil diupdate.");
}
