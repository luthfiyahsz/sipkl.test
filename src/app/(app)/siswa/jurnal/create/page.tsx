import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirectError } from "@/lib/errors";
import { todayInput } from "@/lib/format";
import { createJurnalAction } from "@/actions/siswa";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Tambah Jurnal" };

export default async function SiswaJurnalCreatePage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");

  const pkl = await prisma.pkl.findMany({
    where: { siswaId: user.siswa.id, status: { in: ["disetujui", "selesai"] } },
    orderBy: { createdAt: "desc" },
  });
  if (pkl.length === 0) {
    redirectError("/siswa/jurnal", "Anda belum memiliki PKL yang disetujui.");
  }

  return (
    <>
      <PageHeader
        title="Tambah Jurnal Harian"
        actions={
          <Link href="/siswa/jurnal" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Jurnal">
        <form action={createJurnalAction} className="grid gap-4 md:grid-cols-2">
          <FormField label="PKL" htmlFor="pkl_id" required>
            <select id="pkl_id" name="pkl_id" className="form-select" required>
              <option value="">-- Pilih PKL --</option>
              {pkl.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.judul}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal" htmlFor="tanggal" required>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              className="form-control"
              defaultValue={todayInput()}
              required
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Kegiatan" htmlFor="kegiatan" required>
              <textarea id="kegiatan" name="kegiatan" className="form-control" rows={5} required />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Dokumentasi (foto)"
              htmlFor="dokumentasi"
              hint="JPG/PNG, maksimal 2 MB."
            >
              <input
                id="dokumentasi"
                name="dokumentasi"
                type="file"
                accept="image/jpeg,image/png"
                className="form-control"
              />
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
