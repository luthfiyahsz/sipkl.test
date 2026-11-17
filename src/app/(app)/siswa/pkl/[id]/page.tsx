import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { uploadLaporanAction } from "@/actions/siswa";
import { formatDate, truncate } from "@/lib/format";
import { fileUrl } from "@/lib/uploads";
import { DetailPage } from "@/components/detail-page";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import {
  ApprovalBadge,
  KeyValue,
  PklStatusBadge,
  SectionCard,
} from "@/components/ui";

export const metadata = { title: "Detail PKL" };

export default async function SiswaPklShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");
  const id = Number((await params).id);
  const pkl = Number.isInteger(id)
    ? await prisma.pkl.findUnique({
        where: { id },
        include: {
          guru: { include: { user: true } },
          perusahaan: { include: { user: true } },
          jurnals: { orderBy: { tanggal: "desc" } },
        },
      })
    : null;
  if (!pkl) notFound();
  if (pkl.siswaId !== user.siswa.id) redirect("/forbidden");

  const laporan = fileUrl(pkl.laporanAkhir);

  return (
    <DetailPage title="Detail PKL" backHref="/siswa/pkl">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Informasi PKL">
            <KeyValue
              items={[
                { label: "Judul", value: <span className="font-bold">{pkl.judul}</span> },
                { label: "Guru", value: pkl.guru?.user.name ?? "-" },
                { label: "Perusahaan", value: pkl.perusahaan?.user.name ?? "-" },
                { label: "Status", value: <PklStatusBadge status={pkl.status} /> },
                { label: "Tanggal Mulai", value: formatDate(pkl.tanggalMulai) },
                { label: "Tanggal Selesai", value: formatDate(pkl.tanggalSelesai) },
                {
                  label: "Deskripsi",
                  value: (
                    <span className="whitespace-pre-line">{pkl.deskripsi ?? "-"}</span>
                  ),
                },
                ...(pkl.catatan
                  ? [{ label: "Catatan", value: <span className="text-amber-700">{pkl.catatan}</span> }]
                  : []),
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard title="Upload Laporan Akhir">
          {laporan && (
            <p className="mb-3">
              <a
                href={laporan}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-sm btn-success"
              >
                Lihat Laporan
              </a>
            </p>
          )}
          <form action={uploadLaporanAction} className="space-y-3">
            <input type="hidden" name="id" value={pkl.id} />
            <FormField
              label="File PDF"
              htmlFor="laporan_akhir"
              hint="Maksimal 2 MB, format PDF."
            >
              <input
                id="laporan_akhir"
                name="laporan_akhir"
                type="file"
                accept=".pdf,application/pdf"
                className="form-control"
                required
              />
            </FormField>
            <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Mengupload...">
              Upload
            </SubmitButton>
          </form>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title={`Jurnal Harian (${pkl.jurnals.length})`}>
          {pkl.jurnals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kegiatan</th>
                    <th>Status Dosen</th>
                    <th>Status Perusahaan</th>
                    <th>Dokumentasi</th>
                  </tr>
                </thead>
                <tbody>
                  {pkl.jurnals.map((jurnal) => {
                    const dokumentasi = fileUrl(jurnal.dokumentasi);
                    return (
                      <tr key={jurnal.id}>
                        <td>{formatDate(jurnal.tanggal)}</td>
                        <td>{truncate(jurnal.kegiatan, 60)}</td>
                        <td>
                          <ApprovalBadge status={jurnal.statusDosen} />
                        </td>
                        <td>
                          <ApprovalBadge status={jurnal.statusPerusahaan} />
                        </td>
                        <td>
                          {dokumentasi ? (
                            <a href={dokumentasi} target="_blank" rel="noreferrer noopener">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={dokumentasi}
                                alt="Dokumentasi"
                                className="h-12 w-12 rounded border border-slate-200 object-cover"
                              />
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Belum ada jurnal harian.</p>
          )}
        </SectionCard>
      </div>
    </DetailPage>
  );
}
