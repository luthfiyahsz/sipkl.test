import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DataTable } from "@/components/data-table";
import { PageHeader, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Siswa Bimbingan" };

export default async function GuruSiswaPage() {
  const user = await requireRole("guru");
  if (!user.guru) redirect("/forbidden");

  const pkl = await prisma.pkl.findMany({
    where: { guruId: user.guru.id },
    orderBy: { createdAt: "desc" },
    include: {
      siswa: { include: { user: true } },
      perusahaan: { include: { user: true } },
      penilaians: { where: { guruId: user.guru.id }, select: { id: true } },
    },
  });

  return (
    <>
      <PageHeader title="Siswa Bimbingan" subtitle="Daftar siswa PKL yang Anda bimbing." />
      <SectionCard title="Daftar Bimbingan">
        <DataTable
          columns={["No", "NIS", "Nama", "Judul PKL", "Perusahaan", "Status", "Aksi"]}
          searchPlaceholder="Cari siswa..."
          empty="Belum ada siswa bimbingan."
          rows={pkl.map((item, index) => ({
            key: String(item.id),
            search: `${item.siswa.nis} ${item.siswa.user.name} ${item.judul} ${item.perusahaan?.user.name ?? ""}`,
            cells: [
              index + 1,
              item.siswa.nis,
              item.siswa.user.name,
              item.judul,
              item.perusahaan?.user.name ?? "-",
              <PklStatusBadge key={`status-${item.id}`} status={item.status} />,
              item.penilaians.length > 0 ? (
                <Link
                  key={`nilai-${item.id}`}
                  href={`/guru/penilaian/${item.penilaians[0].id}/edit`}
                  className="btn btn-sm btn-warning"
                >
                  <Star size={14} /> Edit Nilai
                </Link>
              ) : (
                <Link
                  key={`nilai-${item.id}`}
                  href={`/guru/penilaian/create/${item.id}`}
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
