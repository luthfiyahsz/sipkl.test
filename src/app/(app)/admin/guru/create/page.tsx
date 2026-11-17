import Link from "next/link";
import { createGuruAction } from "@/actions/admin";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Tambah Guru" };

export default async function AdminGuruCreatePage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Tambah Guru"
        actions={
          <Link href="/admin/guru" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Guru">
        <form action={createGuruAction} className="grid gap-4 md:grid-cols-2">
          <FormField label="NIP" htmlFor="nip" required>
            <input id="nip" name="nip" className="form-control" required maxLength={20} />
          </FormField>
          <FormField label="Nama" htmlFor="name" required>
            <input id="name" name="name" className="form-control" required maxLength={255} />
          </FormField>
          <FormField label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" className="form-control" required />
          </FormField>
          <FormField label="Password" htmlFor="password" required hint="Minimal 8 karakter.">
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              required
              minLength={8}
            />
          </FormField>
          <FormField label="Gelar" htmlFor="gelar">
            <input id="gelar" name="gelar" className="form-control" maxLength={50} />
          </FormField>
          <FormField label="No. Telp" htmlFor="no_telp">
            <input id="no_telp" name="no_telp" className="form-control" maxLength={20} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Alamat" htmlFor="alamat">
              <textarea id="alamat" name="alamat" className="form-control" rows={2} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Menyimpan...">Simpan</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
