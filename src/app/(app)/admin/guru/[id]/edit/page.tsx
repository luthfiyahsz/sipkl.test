import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateGuruAction } from "@/actions/admin";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit Guru" };

export default async function AdminGuruEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const guru = Number.isInteger(id)
    ? await prisma.guru.findUnique({ where: { id }, include: { user: true } })
    : null;
  if (!guru) notFound();

  return (
    <>
      <PageHeader
        title="Edit Guru"
        actions={
          <Link href="/admin/guru" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Guru">
        <form action={updateGuruAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={guru.id} />
          <FormField label="NIP" htmlFor="nip" required>
            <input
              id="nip"
              name="nip"
              className="form-control"
              required
              maxLength={20}
              defaultValue={guru.nip}
            />
          </FormField>
          <FormField label="Nama" htmlFor="name" required>
            <input
              id="name"
              name="name"
              className="form-control"
              required
              maxLength={255}
              defaultValue={guru.user.name}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              required
              defaultValue={guru.user.email}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" hint="Kosongkan jika tidak diubah.">
            <input id="password" name="password" type="password" className="form-control" />
          </FormField>
          <FormField label="Gelar" htmlFor="gelar">
            <input
              id="gelar"
              name="gelar"
              className="form-control"
              maxLength={50}
              defaultValue={guru.gelar ?? ""}
            />
          </FormField>
          <FormField label="No. Telp" htmlFor="no_telp">
            <input
              id="no_telp"
              name="no_telp"
              className="form-control"
              maxLength={20}
              defaultValue={guru.user.noTelp ?? ""}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Alamat" htmlFor="alamat">
              <textarea
                id="alamat"
                name="alamat"
                className="form-control"
                rows={2}
                defaultValue={guru.user.alamat ?? ""}
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
