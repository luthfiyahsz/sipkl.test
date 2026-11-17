import Link from "next/link";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/format";
import { DataTable } from "@/components/data-table";
import { ApprovalBadge, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Semua Jurnal" };

export default async function AdminJurnalPage() {
  await requireRole("admin");
  const jurnal = await prisma.jurnal.findMany({
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    include: {
      pkl: {
        include: {
          siswa: { include: { user: true } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader title="Semua Jurnal Harian" subtitle="Jurnal dari seluruh siswa PKL." />
      <SectionCard title="Daftar Jurnal">
        <DataTable
          columns={["No", "Siswa", "Tanggal", "Kegiatan", "Status Dosen", "Status Perusahaan", "Aksi"]}
          searchPlaceholder="Cari jurnal..."
          empty="Belum ada jurnal."
          rows={jurnal.map((item, index) => ({
            key: String(item.id),
            search: `${item.pkl.siswa.user.name} ${item.kegiatan} ${formatDate(item.tanggal)}`,
            cells: [
              index + 1,
              item.pkl.siswa.user.name,
              formatDate(item.tanggal),
              truncate(item.kegiatan, 50),
              <ApprovalBadge key={`dosen-${item.id}`} status={item.statusDosen} />,
              <ApprovalBadge key={`perusahaan-${item.id}`} status={item.statusPerusahaan} />,
              <Link
                key={`aksi-${item.id}`}
                href={`/admin/jurnal/${item.id}`}
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
