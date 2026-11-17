import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateJurnalAction } from "@/actions/siswa";
import { toDateInput } from "@/lib/format";
import { fileUrl } from "@/lib/uploads";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit Jurnal" };

export default async function SiswaJurnalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");
  const id = Number((await params).id);
  const jurnal = Number.isInteger(id)
    ? await prisma.jurnal.findUnique({ where: { id }, include: { pkl: true } })
    : null;
  if (!jurnal) notFound();
  if (jurnal.pkl.siswaId !== user.siswa.id) redirect("/forbidden");

  const pkl = await prisma.pkl.findMany({
    where: { siswaId: user.siswa.id, status: { in: ["disetujui", "selesai"] } },
    orderBy: { createdAt: "desc" },
  });
  const options = pkl.some((item) => item.id === jurnal.pklId)
    ? pkl
    : [jurnal.pkl, ...pkl];
  const dokumentasi = fileUrl(jurnal.dokumentasi);

  return (
    <>
      <PageHeader
        title="Edit Jurnal Harian"
        actions={
          <Link href="/siswa/jurnal" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <SectionCard title="Form Jurnal">
        <form action={updateJurnalAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={jurnal.id} />
          <FormField label="PKL" htmlFor="pkl_id" required>
            <select id="pkl_id" name="pkl_id" className="form-select" defaultValue={jurnal.pklId} required>
              {options.map((item) => (
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
              defaultValue={toDateInput(jurnal.tanggal)}
              required
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Kegiatan" htmlFor="kegiatan" required>
              <textarea
                id="kegiatan"
                name="kegiatan"
                className="form-control"
                rows={5}
                defaultValue={jurnal.kegiatan}
                required
              />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Dokumentasi"
              htmlFor="dokumentasi"
              hint="Kosongkan jika tidak ingin mengganti foto. JPG/PNG, maksimal 2 MB."
            >
              {dokumentasi && (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dokumentasi}
                    alt="Dokumentasi saat ini"
                    className="h-32 w-auto rounded-lg border border-slate-200 object-cover"
                  />
                </div>
              )}
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
            <SubmitButton pendingLabel="Mengupdate...">Update</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
