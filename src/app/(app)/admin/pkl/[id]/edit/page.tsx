import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updatePklStatusAction } from "@/actions/admin";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { KeyValue, PageHeader, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit Status PKL" };

export default async function AdminPklEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const pkl = Number.isInteger(id)
    ? await prisma.pkl.findUnique({
        where: { id },
        include: {
          siswa: { include: { user: true } },
          guru: { include: { user: true } },
          perusahaan: { include: { user: true } },
        },
      })
    : null;
  if (!pkl) notFound();

  return (
    <>
      <PageHeader
        title="Edit Status PKL"
        actions={
          <Link href="/admin/pkl" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi PKL">
          <KeyValue
            items={[
              { label: "Siswa", value: <span className="font-bold">{pkl.siswa.user.name}</span> },
              { label: "Judul", value: pkl.judul },
              { label: "Guru", value: pkl.guru?.user.name ?? "-" },
              { label: "Perusahaan", value: pkl.perusahaan?.user.name ?? "-" },
              { label: "Status Saat Ini", value: <PklStatusBadge status={pkl.status} /> },
            ]}
          />
        </SectionCard>

        <SectionCard title="Ubah Status">
          <form action={updatePklStatusAction} className="space-y-4">
            <input type="hidden" name="id" value={pkl.id} />
            <FormField label="Status" htmlFor="status" required>
              <select id="status" name="status" className="form-select" defaultValue={pkl.status}>
                <option value="pengajuan">Pengajuan</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
                <option value="selesai">Selesai</option>
              </select>
            </FormField>
            <FormField label="Catatan" htmlFor="catatan">
              <textarea
                id="catatan"
                name="catatan"
                className="form-control"
                rows={3}
                defaultValue={pkl.catatan ?? ""}
              />
            </FormField>
            <SubmitButton pendingLabel="Mengupdate...">Update Status</SubmitButton>
          </form>
        </SectionCard>
      </div>
    </>
  );
}
