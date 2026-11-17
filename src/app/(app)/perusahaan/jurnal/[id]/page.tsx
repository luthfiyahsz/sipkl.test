import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { commentJurnalAction } from "@/actions/perusahaan";
import { formatDate } from "@/lib/format";
import { fileUrl } from "@/lib/uploads";
import { DetailPage } from "@/components/detail-page";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import {
  ApprovalBadge,
  InfoAlert,
  KeyValue,
  SectionCard,
} from "@/components/ui";

export const metadata = { title: "Detail Jurnal" };

export default async function PerusahaanJurnalShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("perusahaan");
  if (!user.perusahaan) redirect("/forbidden");
  const id = Number((await params).id);
  const jurnal = Number.isInteger(id)
    ? await prisma.jurnal.findUnique({
        where: { id },
        include: {
          pkl: {
            include: {
              siswa: { include: { user: true } },
              guru: { include: { user: true } },
            },
          },
        },
      })
    : null;
  if (!jurnal) notFound();
  if (jurnal.pkl.perusahaanId !== user.perusahaan.id) redirect("/forbidden");

  const dokumentasi = fileUrl(jurnal.dokumentasi);

  return (
    <DetailPage title="Detail Jurnal" backHref="/perusahaan/jurnal">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Kegiatan Jurnal">
            <KeyValue
              items={[
                {
                  label: "Siswa",
                  value: <span className="font-bold">{jurnal.pkl.siswa.user.name}</span>,
                },
                { label: "Guru", value: jurnal.pkl.guru?.user.name ?? "-" },
                { label: "Tanggal", value: formatDate(jurnal.tanggal) },
                {
                  label: "Kegiatan",
                  value: <span className="whitespace-pre-line">{jurnal.kegiatan}</span>,
                },
                {
                  label: "Dokumentasi",
                  value: dokumentasi ? (
                    <a href={dokumentasi} target="_blank" rel="noreferrer noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dokumentasi}
                        alt={`Dokumentasi jurnal ${formatDate(jurnal.tanggal)}`}
                        className="h-48 w-auto rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  ) : (
                    "-"
                  ),
                },
                {
                  label: "Status Perusahaan",
                  value: <ApprovalBadge status={jurnal.statusPerusahaan} />,
                },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard title="Komentar Perusahaan">
          {jurnal.komentarPerusahaan && (
            <div className="mb-3">
              <InfoAlert message={jurnal.komentarPerusahaan} />
            </div>
          )}
          <form action={commentJurnalAction} className="space-y-3">
            <input type="hidden" name="id" value={jurnal.id} />
            <FormField label="Komentar" htmlFor="komentar_perusahaan" required>
              <textarea
                id="komentar_perusahaan"
                name="komentar_perusahaan"
                className="form-control"
                rows={4}
                required
              />
            </FormField>
            <FormField label="Ubah Status" htmlFor="status_perusahaan">
              <select
                id="status_perusahaan"
                name="status_perusahaan"
                className="form-select"
                defaultValue={jurnal.statusPerusahaan}
              >
                <option value="pending">Pending</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </FormField>
            <SubmitButton className="btn btn-primary" pendingLabel="Mengirim...">
              Kirim Komentar
            </SubmitButton>
          </form>
        </SectionCard>
      </div>
    </DetailPage>
  );
}
