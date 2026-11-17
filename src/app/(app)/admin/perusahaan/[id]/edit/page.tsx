import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updatePerusahaanAction } from "@/actions/admin";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit Perusahaan" };

export default async function AdminPerusahaanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const perusahaan = Number.isInteger(id)
    ? await prisma.perusahaan.findUnique({ where: { id }, include: { user: true } })
    : null;
  if (!perusahaan) notFound();

  return (
    <>
      <PageHeader
        title="Edit Perusahaan"
        actions={
          <Link href="/admin/perusahaan" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Perusahaan">
        <form action={updatePerusahaanAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={perusahaan.id} />
          <FormField label="Nama Perusahaan" htmlFor="name" required>
            <input
              id="name"
              name="name"
              className="form-control"
              required
              maxLength={255}
              defaultValue={perusahaan.user.name}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              required
              defaultValue={perusahaan.user.email}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" hint="Kosongkan jika tidak diubah.">
            <input id="password" name="password" type="password" className="form-control" />
          </FormField>
          <FormField label="Kontak Person" htmlFor="kontak_person">
            <input
              id="kontak_person"
              name="kontak_person"
              className="form-control"
              maxLength={100}
              defaultValue={perusahaan.kontakPerson ?? ""}
            />
          </FormField>
          <FormField label="No. Telp" htmlFor="no_telp">
            <input
              id="no_telp"
              name="no_telp"
              className="form-control"
              maxLength={20}
              defaultValue={perusahaan.user.noTelp ?? ""}
            />
          </FormField>
          <FormField label="Website" htmlFor="website">
            <input
              id="website"
              name="website"
              type="url"
              className="form-control"
              defaultValue={perusahaan.website ?? ""}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Alamat" htmlFor="alamat">
              <textarea
                id="alamat"
                name="alamat"
                className="form-control"
                rows={2}
                defaultValue={perusahaan.user.alamat ?? ""}
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
