import { CalendarCheck, UserX, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate, todayDate } from "@/lib/format";
import { DataTable } from "@/components/data-table";
import { AbsensiBadge, PageHeader, SectionCard, StatCard } from "@/components/ui";

export const metadata = { title: "Data Absensi" };

export default async function AdminAbsensiPage() {
  await requireRole("admin");
  const today = todayDate();
  const [absensi, totalSiswa, todayHadir, todaySubmitted] = await Promise.all([
    prisma.absensi.findMany({
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      include: { siswa: { include: { user: true } } },
    }),
    prisma.siswa.count(),
    prisma.absensi.count({ where: { tanggal: today, status: "hadir" } }),
    prisma.absensi.count({ where: { tanggal: today } }),
  ]);

  return (
    <>
      <PageHeader title="Data Absensi" subtitle="Rekap absensi harian siswa PKL." />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Hadir Hari Ini" value={todayHadir} icon={CalendarCheck} tone="success" />
        <StatCard label="Total Siswa" value={totalSiswa} icon={Users} tone="warning" />
        <StatCard
          label="Belum Absen"
          value={Math.max(0, totalSiswa - todaySubmitted)}
          icon={UserX}
          tone="danger"
        />
      </div>

      <SectionCard title="Riwayat Absensi">
        <DataTable
          columns={["No", "Siswa", "NIS", "Tanggal", "Status", "Keterangan"]}
          searchPlaceholder="Cari absensi..."
          empty="Belum ada data absensi."
          rows={absensi.map((item, index) => ({
            key: String(item.id),
            search: `${item.siswa.user.name} ${item.siswa.nis} ${formatDate(item.tanggal)} ${item.status}`,
            cells: [
              index + 1,
              item.siswa.user.name,
              item.siswa.nis,
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
