import Link from "next/link";
import { createPerusahaanAction } from "@/actions/admin";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Tambah Perusahaan" };

export default async function AdminPerusahaanCreatePage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Tambah Perusahaan"
        actions={
          <Link href="/admin/perusahaan" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Perusahaan">
        <form action={createPerusahaanAction} className="grid gap-4 md:grid-cols-2">
          <FormField label="Nama Perusahaan" htmlFor="name" required>
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
          <FormField label="Kontak Person" htmlFor="kontak_person">
            <input id="kontak_person" name="kontak_person" className="form-control" maxLength={100} />
          </FormField>
          <FormField label="No. Telp" htmlFor="no_telp">
            <input id="no_telp" name="no_telp" className="form-control" maxLength={20} />
          </FormField>
          <FormField label="Website" htmlFor="website" hint="Contoh: https://example.com">
            <input id="website" name="website" type="url" className="form-control" />
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
