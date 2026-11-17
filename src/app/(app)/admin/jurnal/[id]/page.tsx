import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { fileUrl } from "@/lib/uploads";
import { DetailPage } from "@/components/detail-page";
import { ApprovalBadge, KeyValue, SectionCard } from "@/components/ui";

export const metadata = { title: "Detail Jurnal" };

export default async function AdminJurnalShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const jurnal = Number.isInteger(id)
    ? await prisma.jurnal.findUnique({
        where: { id },
        include: {
          pkl: {
            include: {
              siswa: { include: { user: true } },
              guru: { include: { user: true } },
              perusahaan: { include: { user: true } },
            },
          },
        },
      })
    : null;
  if (!jurnal) notFound();

  const dokumentasi = fileUrl(jurnal.dokumentasi);

  return (
    <DetailPage title="Detail Jurnal" backHref="/admin/jurnal">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Kegiatan">
            <KeyValue
              items={[
                { label: "Siswa", value: <span className="font-bold">{jurnal.pkl.siswa.user.name}</span> },
                { label: "Tanggal", value: formatDate(jurnal.tanggal) },
                { label: "PKL", value: jurnal.pkl.judul },
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
                        className="h-40 w-auto rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  ) : (
                    "-"
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Status">
            <KeyValue
              items={[
                { label: "Dosen", value: <ApprovalBadge status={jurnal.statusDosen} /> },
                {
                  label: "Perusahaan",
                  value: <ApprovalBadge status={jurnal.statusPerusahaan} />,
                },
              ]}
            />
          </SectionCard>

          {jurnal.komentarDosen && (
            <SectionCard title="Komentar Dosen">
              <p className="whitespace-pre-line text-sm text-slate-700">{jurnal.komentarDosen}</p>
            </SectionCard>
          )}
          {jurnal.komentarPerusahaan && (
            <SectionCard title="Komentar Perusahaan">
              <p className="whitespace-pre-line text-sm text-slate-700">
                {jurnal.komentarPerusahaan}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </DetailPage>
  );
}
