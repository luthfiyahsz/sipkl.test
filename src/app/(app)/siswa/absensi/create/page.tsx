import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { todayDate } from "@/lib/format";
import { createAbsensiAction } from "@/actions/siswa";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { InfoAlert, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Absen Hari Ini" };

export default async function SiswaAbsensiCreatePage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");

  const existing = await prisma.absensi.findUnique({
    where: { siswaId_tanggal: { siswaId: user.siswa.id, tanggal: todayDate() } },
    select: { status: true, keterangan: true },
  });

  return (
    <>
      <PageHeader
        title="Absen Hari Ini"
        actions={
          <Link href="/siswa/absensi" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <div className="mx-auto max-w-xl">
        <SectionCard title="Form Absensi">
          {existing ? (
            <InfoAlert
              message={`Anda sudah absen hari ini dengan status ${existing.status}${existing.keterangan ? ` (${existing.keterangan})` : ""}.`}
            />
          ) : (
            <form action={createAbsensiAction} className="space-y-4">
              <FormField label="Status" htmlFor="status" required>
                <select id="status" name="status" className="form-select" required defaultValue="">
                  <option value="">-- Pilih --</option>
                  <option value="hadir">Hadir</option>
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
                  <option value="alpha">Alpha</option>
                </select>
              </FormField>
              <FormField label="Keterangan" htmlFor="keterangan">
                <textarea
                  id="keterangan"
                  name="keterangan"
                  className="form-control"
                  rows={3}
                  placeholder="Opsional"
                />
              </FormField>
              <SubmitButton pendingLabel="Menyimpan...">Simpan</SubmitButton>
            </form>
          )}
        </SectionCard>
      </div>
    </>
  );
}
