import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/format";
import { DataTable } from "@/components/data-table";
import { ApprovalBadge, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Jurnal Siswa" };

export default async function PerusahaanJurnalPage() {
  const user = await requireRole("perusahaan");
  if (!user.perusahaan) redirect("/forbidden");

  const jurnal = await prisma.jurnal.findMany({
    where: { pkl: { perusahaanId: user.perusahaan.id } },
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    include: { pkl: { include: { siswa: { include: { user: true } } } } },
  });

  return (
    <>
      <PageHeader title="Jurnal Siswa" subtitle="Jurnal harian siswa PKL di perusahaan Anda." />
      <SectionCard title="Daftar Jurnal">
        <DataTable
          columns={["No", "Siswa", "Tanggal", "Kegiatan", "Status", "Aksi"]}
          searchPlaceholder="Cari jurnal..."
          empty="Belum ada jurnal."
          rows={jurnal.map((item, index) => ({
            key: String(item.id),
            search: `${item.pkl.siswa.user.name} ${formatDate(item.tanggal)} ${item.kegiatan}`,
            cells: [
              index + 1,
              item.pkl.siswa.user.name,
              formatDate(item.tanggal),
              truncate(item.kegiatan, 50),
              <ApprovalBadge key={`status-${item.id}`} status={item.statusPerusahaan} />,
              <Link
                key={`aksi-${item.id}`}
                href={`/perusahaan/jurnal/${item.id}`}
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
