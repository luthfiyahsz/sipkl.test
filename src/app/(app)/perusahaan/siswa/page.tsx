import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DataTable } from "@/components/data-table";
import { PageHeader, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Siswa PKL" };

export default async function PerusahaanSiswaPage() {
  const user = await requireRole("perusahaan");
  if (!user.perusahaan) redirect("/forbidden");

  const pkl = await prisma.pkl.findMany({
    where: { perusahaanId: user.perusahaan.id },
    orderBy: { createdAt: "desc" },
    include: {
      siswa: { include: { user: true } },
      guru: { include: { user: true } },
      penilaians: { where: { perusahaanId: user.perusahaan.id }, select: { id: true } },
    },
  });

  return (
    <>
      <PageHeader title="Siswa PKL" subtitle="Daftar siswa yang melaksanakan PKL di perusahaan Anda." />
      <SectionCard title="Daftar Siswa">
        <DataTable
          columns={["No", "NIS", "Nama", "Judul PKL", "Guru", "Status", "Aksi"]}
          searchPlaceholder="Cari siswa..."
          empty="Belum ada siswa PKL."
          rows={pkl.map((item, index) => ({
            key: String(item.id),
            search: `${item.siswa.nis} ${item.siswa.user.name} ${item.judul} ${item.guru?.user.name ?? ""}`,
            cells: [
              index + 1,
              item.siswa.nis,
              item.siswa.user.name,
              item.judul,
              item.guru?.user.name ?? "-",
              <PklStatusBadge key={`status-${item.id}`} status={item.status} />,
              item.penilaians.length > 0 ? (
                <Link
                  key={`nilai-${item.id}`}
                  href={`/perusahaan/penilaian/${item.penilaians[0].id}/edit`}
                  className="btn btn-sm btn-warning"
                >
                  <Star size={14} /> Edit Nilai
                </Link>
              ) : (
                <Link
                  key={`nilai-${item.id}`}
                  href={`/perusahaan/penilaian/create/${item.id}`}
                  className="btn btn-sm btn-success"
                >
                  <Star size={14} /> Beri Nilai
                </Link>
              ),
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
