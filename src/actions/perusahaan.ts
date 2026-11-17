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

async function perusahaanProfile() {
  const user = await requireRole("perusahaan");
  if (!user.perusahaan) {
    redirectError("/perusahaan/dashboard", "Profil perusahaan tidak ditemukan. Hubungi admin.");
  }
  return { user, perusahaan: user.perusahaan };
}

/** Pastikan jurnal berada pada PKL di perusahaan yang sedang login. */
async function ownedJurnal(jurnalId: number, perusahaanId: number) {
  const jurnal = await prisma.jurnal.findUnique({
    where: { id: jurnalId },
    include: { pkl: { select: { perusahaanId: true } } },
  });
  if (!jurnal) redirectError("/perusahaan/jurnal", "Data jurnal tidak ditemukan.");
  if (jurnal.pkl.perusahaanId !== perusahaanId) {
    redirectError("/perusahaan/jurnal", "Anda tidak berhak memproses jurnal ini.");
  }
  return jurnal;
}

const komentarSchema = z.object({
  komentar: z
    .string()
    .trim()
    .min(1, "Komentar wajib diisi.")
    .max(5000, "Komentar terlalu panjang."),
  status: z
    .enum(["pending", "disetujui", "ditolak"], {
      errorMap: () => ({ message: "Status jurnal tidak valid." }),
    })
    .optional(),
});

export async function commentJurnalAction(formData: FormData): Promise<never> {
  const { perusahaan } = await perusahaanProfile();
  const id = idField(formData.get("id"));
  if (!id) redirectError("/perusahaan/jurnal", "Data jurnal tidak ditemukan.");
  const jurnal = await ownedJurnal(id, perusahaan.id);

  const parsed = komentarSchema.safeParse({
    komentar: safeString(formData.get("komentar_perusahaan")),
    status: optionalString(formData.get("status_perusahaan")),
  });
  if (!parsed.success) redirectError(`/perusahaan/jurnal/${id}`, firstIssue(parsed.error));

  try {
    await prisma.jurnal.update({
      where: { id: jurnal.id },
      data: {
        komentarPerusahaan: parsed.data.komentar,
        ...(parsed.data.status ? { statusPerusahaan: parsed.data.status } : {}),
      },
    });
  } catch (error) {
    redirectError(`/perusahaan/jurnal/${id}`, prismaErrorMessage(error));
  }

  revalidatePath(`/perusahaan/jurnal/${id}`);
  revalidatePath("/perusahaan/jurnal");
  revalidatePath("/perusahaan/dashboard");
  redirectSuccess(`/perusahaan/jurnal/${id}`, "Komentar berhasil ditambahkan.");
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
  const { perusahaan } = await perusahaanProfile();
  const parsed = penilaianSchema.safeParse(penilaianValues(formData));
  const back = "/perusahaan/penilaian";
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));

  const pkl = await prisma.pkl.findUnique({ where: { id: parsed.data.pklId } });
  if (!pkl) redirectError(back, "Data PKL tidak ditemukan.");
  if (pkl.perusahaanId !== perusahaan.id) {
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
      where: { pklId: pkl.id, perusahaanId: perusahaan.id },
      select: { id: true },
    });
    if (existing) {
      await prisma.penilaian.update({ where: { id: existing.id }, data: scores });
    } else {
      await prisma.penilaian.create({
        data: {
          pklId: pkl.id,
          perusahaanId: perusahaan.id,
          guruId: pkl.guruId,
          ...scores,
        },
      });
    }
  } catch (error) {
    redirectError(back, prismaErrorMessage(error));
  }

  revalidatePath("/perusahaan/penilaian");
  revalidatePath("/perusahaan/dashboard");
  revalidatePath("/admin/penilaian");
  redirectSuccess(back, "Penilaian berhasil disimpan.");
}

export async function updatePenilaianAction(formData: FormData): Promise<never> {
  const { perusahaan } = await perusahaanProfile();
  const id = idField(formData.get("id"));
  const back = id ? `/perusahaan/penilaian/${id}/edit` : "/perusahaan/penilaian";
  if (!id) redirectError("/perusahaan/penilaian", "Data penilaian tidak ditemukan.");

  const penilaian = await prisma.penilaian.findUnique({ where: { id } });
  if (!penilaian) redirectError("/perusahaan/penilaian", "Data penilaian tidak ditemukan.");
  if (penilaian.perusahaanId !== perusahaan.id) {
    redirectError("/perusahaan/penilaian", "Anda tidak berhak mengubah penilaian ini.");
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

  revalidatePath("/perusahaan/penilaian");
  revalidatePath("/admin/penilaian");
  redirectSuccess("/perusahaan/penilaian", "Penilaian berhasil diupdate.");
}
