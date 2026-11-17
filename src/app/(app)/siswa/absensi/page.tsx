import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { DataTable } from "@/components/data-table";
import { AbsensiBadge, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Absensi" };

export default async function SiswaAbsensiPage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");

  const absensi = await prisma.absensi.findMany({
    where: { siswaId: user.siswa.id },
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Absensi Harian"
        actions={
          <Link href="/siswa/absensi/create" className="btn btn-primary">
            <Plus size={16} /> Absen Hari Ini
          </Link>
        }
      />
      <SectionCard title="Riwayat Absensi">
        <DataTable
          columns={["No", "Tanggal", "Status", "Keterangan"]}
          searchPlaceholder="Cari absensi..."
          empty="Belum ada absensi."
          rows={absensi.map((item, index) => ({
            key: String(item.id),
            search: `${formatDate(item.tanggal)} ${item.status} ${item.keterangan ?? ""}`,
            cells: [
              index + 1,
              formatDate(item.tanggal),
              <AbsensiBadge key={`status-${item.id}`} status={item.status} />,
              item.keterangan ?? "-",
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
