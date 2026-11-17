import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DetailPage } from "@/components/detail-page";
import { KeyValue, ScoreBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Detail Penilaian" };

export default async function AdminPenilaianShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const penilaian = Number.isInteger(id)
    ? await prisma.penilaian.findUnique({
        where: { id },
        include: {
          pkl: { include: { siswa: { include: { user: true } } } },
          guru: { include: { user: true } },
          perusahaan: { include: { user: true } },
        },
      })
    : null;
  if (!penilaian) notFound();

  return (
    <DetailPage title="Detail Penilaian" backHref="/admin/penilaian">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi PKL">
          <KeyValue
            items={[
              {
                label: "Siswa",
                value: <span className="font-bold">{penilaian.pkl.siswa.user.name}</span>,
              },
              { label: "Judul", value: penilaian.pkl.judul },
              { label: "Guru", value: penilaian.guru?.user.name ?? "-" },
              { label: "Perusahaan", value: penilaian.perusahaan?.user.name ?? "-" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Nilai">
          <KeyValue
            items={[
              { label: "Kedisiplinan", value: penilaian.nilaiKedisiplinan ?? "-" },
              { label: "Kerjasama", value: penilaian.nilaiKerjasama ?? "-" },
              { label: "Pengetahuan", value: penilaian.nilaiPengetahuan ?? "-" },
              { label: "Keterampilan", value: penilaian.nilaiKeterampilan ?? "-" },
              { label: "Laporan", value: penilaian.nilaiLaporan ?? "-" },
              { label: "Total Nilai", value: <ScoreBadge score={penilaian.totalNilai} /> },
              { label: "Komentar", value: penilaian.komentar ?? "-" },
            ]}
          />
        </SectionCard>
      </div>
    </DetailPage>
  );
}
