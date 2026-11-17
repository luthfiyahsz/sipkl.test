import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateSiswaAction } from "@/actions/admin";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit Siswa SMK" };

export default async function AdminSiswaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const siswa = Number.isInteger(id)
    ? await prisma.siswa.findUnique({ where: { id }, include: { user: true } })
    : null;
  if (!siswa) notFound();

  return (
    <>
      <PageHeader
        title="Edit Siswa SMK"
        actions={
          <Link href="/admin/siswa" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Siswa">
        <form action={updateSiswaAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={siswa.id} />
          <FormField label="NIS" htmlFor="nis" required>
            <input
              id="nis"
              name="nis"
              className="form-control"
              required
              maxLength={20}
              defaultValue={siswa.nis}
            />
          </FormField>
          <FormField label="Nama" htmlFor="name" required>
            <input
              id="name"
              name="name"
              className="form-control"
              required
              maxLength={255}
              defaultValue={siswa.user.name}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              required
              defaultValue={siswa.user.email}
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="password"
            hint="Kosongkan jika tidak diubah. Minimal 8 karakter."
          >
            <input id="password" name="password" type="password" className="form-control" />
          </FormField>
          <FormField label="Kelas" htmlFor="kelas">
            <select id="kelas" name="kelas" className="form-select" defaultValue={siswa.kelas ?? ""}>
              <option value="">-- Pilih Kelas --</option>
              <option value="X">X</option>
              <option value="XI">XI</option>
              <option value="XII">XII</option>
            </select>
          </FormField>
          <FormField label="No. Telp" htmlFor="no_telp">
            <input
              id="no_telp"
              name="no_telp"
              className="form-control"
              maxLength={20}
              defaultValue={siswa.user.noTelp ?? ""}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Alamat" htmlFor="alamat">
              <textarea
                id="alamat"
                name="alamat"
                className="form-control"
                rows={2}
                defaultValue={siswa.user.alamat ?? ""}
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
