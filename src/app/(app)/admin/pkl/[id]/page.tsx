import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { fileUrl } from "@/lib/uploads";
import { DetailPage } from "@/components/detail-page";
import {
  ApprovalBadge,
  KeyValue,
  PklStatusBadge,
  SectionCard,
} from "@/components/ui";

export const metadata = { title: "Detail PKL" };

export default async function AdminPklShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const pkl = Number.isInteger(id)
    ? await prisma.pkl.findUnique({
        where: { id },
        include: {
          siswa: { include: { user: true } },
          guru: { include: { user: true } },
          perusahaan: { include: { user: true } },
          jurnals: { orderBy: { tanggal: "desc" } },
        },
      })
    : null;
  if (!pkl) notFound();

  const laporan = fileUrl(pkl.laporanAkhir);

  return (
    <DetailPage title="Detail PKL" backHref="/admin/pkl">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi PKL">
          <KeyValue
            items={[
              { label: "Judul", value: <span className="font-bold">{pkl.judul}</span> },
              {
                label: "Siswa",
                value: `${pkl.siswa.user.name} (${pkl.siswa.nis})`,
              },
              { label: "Guru", value: pkl.guru?.user.name ?? "-" },
              { label: "Perusahaan", value: pkl.perusahaan?.user.name ?? "-" },
              { label: "Status", value: <PklStatusBadge status={pkl.status} /> },
              { label: "Tanggal Mulai", value: formatDate(pkl.tanggalMulai) },
              { label: "Tanggal Selesai", value: formatDate(pkl.tanggalSelesai) },
              { label: "Catatan", value: pkl.catatan ?? "-" },
              {
                label: "Laporan",
                value: laporan ? (
                  <a
                    href={laporan}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Lihat Laporan
                  </a>
                ) : (
                  "-"
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard title={`Jurnal Harian (${pkl.jurnals.length})`}>
          {pkl.jurnals.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Status Dosen</th>
                  <th>Status Perusahaan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pkl.jurnals.map((jurnal) => (
                  <tr key={jurnal.id}>
                    <td>{formatDate(jurnal.tanggal)}</td>
                    <td>
                      <ApprovalBadge status={jurnal.statusDosen} />
                    </td>
                    <td>
                      <ApprovalBadge status={jurnal.statusPerusahaan} />
                    </td>
                    <td>
                      <Link href={`/admin/jurnal/${jurnal.id}`} className="btn btn-sm btn-info">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">Belum ada jurnal.</p>
          )}
        </SectionCard>
      </div>
    </DetailPage>
  );
}
