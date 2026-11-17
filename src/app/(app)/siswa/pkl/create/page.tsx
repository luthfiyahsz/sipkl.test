import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createPklAction } from "@/actions/siswa";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Ajukan PKL" };

export default async function SiswaPklCreatePage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");

  const [guru, perusahaan] = await Promise.all([
    prisma.guru.findMany({ include: { user: true }, orderBy: { nip: "asc" } }),
    prisma.perusahaan.findMany({ include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Ajukan PKL"
        actions={
          <Link href="/siswa/pkl" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Pengajuan">
        <form action={createPklAction} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField label="Judul PKL" htmlFor="judul" required>
              <input id="judul" name="judul" className="form-control" required maxLength={255} />
            </FormField>
          </div>
          <FormField label="Guru Pembimbing" htmlFor="guru_id">
            <select id="guru_id" name="guru_id" className="form-select">
              <option value="">-- Pilih Guru --</option>
              {guru.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.user.name} ({item.nip})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Perusahaan" htmlFor="perusahaan_id">
            <select id="perusahaan_id" name="perusahaan_id" className="form-select">
              <option value="">-- Pilih Perusahaan --</option>
              {perusahaan.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.user.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Mulai" htmlFor="tanggal_mulai">
            <input id="tanggal_mulai" name="tanggal_mulai" type="date" className="form-control" />
          </FormField>
          <FormField label="Tanggal Selesai" htmlFor="tanggal_selesai">
            <input id="tanggal_selesai" name="tanggal_selesai" type="date" className="form-control" />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Deskripsi" htmlFor="deskripsi">
              <textarea id="deskripsi" name="deskripsi" className="form-control" rows={3} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Mengirim...">Ajukan</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
