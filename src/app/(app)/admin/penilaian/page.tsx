import Link from "next/link";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DataTable } from "@/components/data-table";
import { PageHeader, ScoreBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Data Penilaian" };

export default async function AdminPenilaianPage() {
  await requireRole("admin");
  const penilaian = await prisma.penilaian.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pkl: { include: { siswa: { include: { user: true } } } },
      guru: { include: { user: true } },
      perusahaan: { include: { user: true } },
    },
  });

  return (
    <>
      <PageHeader title="Data Penilaian" subtitle="Penilaian PKL dari guru dan perusahaan." />
      <SectionCard title="Daftar Penilaian">
        <DataTable
          columns={["No", "Siswa", "Judul PKL", "Guru", "Perusahaan", "Nilai", "Aksi"]}
          searchPlaceholder="Cari penilaian..."
          empty="Belum ada penilaian."
          rows={penilaian.map((item, index) => ({
            key: String(item.id),
            search: `${item.pkl.siswa.user.name} ${item.pkl.judul} ${item.guru?.user.name ?? ""} ${item.perusahaan?.user.name ?? ""}`,
            cells: [
              index + 1,
              item.pkl.siswa.user.name,
              item.pkl.judul,
              item.guru?.user.name ?? "-",
              item.perusahaan?.user.name ?? "-",
              <ScoreBadge key={`nilai-${item.id}`} score={item.totalNilai} />,
              <Link
                key={`aksi-${item.id}`}
                href={`/admin/penilaian/${item.id}`}
                className="btn btn-sm btn-info"
                title="Detail"
              >
                <Eye size={14} />
              </Link>,
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
