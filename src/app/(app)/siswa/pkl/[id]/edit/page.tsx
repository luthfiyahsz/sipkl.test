import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updatePklAction } from "@/actions/siswa";
import { redirectError } from "@/lib/errors";
import { toDateInput } from "@/lib/format";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit PKL" };

export default async function SiswaPklEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");
  const id = Number((await params).id);
  const pkl = Number.isInteger(id)
    ? await prisma.pkl.findUnique({ where: { id } })
    : null;
  if (!pkl) notFound();
  if (pkl.siswaId !== user.siswa.id) redirect("/forbidden");
  if (pkl.status !== "pengajuan") {
    redirectError("/siswa/pkl", "PKL yang sudah diproses tidak dapat diubah.");
  }

  const [guru, perusahaan] = await Promise.all([
    prisma.guru.findMany({ include: { user: true }, orderBy: { nip: "asc" } }),
    prisma.perusahaan.findMany({ include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Edit PKL"
        actions={
          <Link href="/siswa/pkl" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form PKL">
        <form action={updatePklAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={pkl.id} />
          <div className="md:col-span-2">
            <FormField label="Judul" htmlFor="judul" required>
              <input
                id="judul"
                name="judul"
                className="form-control"
                required
                maxLength={255}
                defaultValue={pkl.judul}
              />
            </FormField>
          </div>
          <FormField label="Guru Pembimbing" htmlFor="guru_id">
            <select
              id="guru_id"
              name="guru_id"
              className="form-select"
              defaultValue={pkl.guruId ?? ""}
            >
              <option value="">-- Pilih Guru --</option>
              {guru.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.user.name} ({item.nip})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Perusahaan" htmlFor="perusahaan_id">
            <select
              id="perusahaan_id"
              name="perusahaan_id"
              className="form-select"
              defaultValue={pkl.perusahaanId ?? ""}
            >
              <option value="">-- Pilih Perusahaan --</option>
              {perusahaan.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.user.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Mulai" htmlFor="tanggal_mulai">
            <input
              id="tanggal_mulai"
              name="tanggal_mulai"
              type="date"
              className="form-control"
              defaultValue={toDateInput(pkl.tanggalMulai)}
            />
          </FormField>
          <FormField label="Tanggal Selesai" htmlFor="tanggal_selesai">
            <input
              id="tanggal_selesai"
              name="tanggal_selesai"
              type="date"
              className="form-control"
              defaultValue={toDateInput(pkl.tanggalSelesai)}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Deskripsi" htmlFor="deskripsi">
              <textarea
                id="deskripsi"
                name="deskripsi"
                className="form-control"
                rows={3}
                defaultValue={pkl.deskripsi ?? ""}
              />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Mengupdate...">Update</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
