import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Briefcase, Clock3, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, SectionCard, StatCard } from "@/components/ui";

export const metadata = { title: "Dashboard Perusahaan" };

export default async function PerusahaanDashboardPage() {
  const user = await requireRole("perusahaan");
  if (!user.perusahaan) redirect("/forbidden");
  const perusahaanId = user.perusahaan.id;

  const [totalSiswa, totalPklAktif, totalJurnalPending] = await Promise.all([
    prisma.pkl.count({ where: { perusahaanId } }),
    prisma.pkl.count({
      where: { perusahaanId, status: { in: ["disetujui", "selesai"] } },
    }),
    prisma.jurnal.count({
      where: { pkl: { perusahaanId }, statusPerusahaan: "pending" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard Perusahaan"
        subtitle="Ringkasan siswa PKL dan jurnal di perusahaan Anda."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Siswa PKL" value={totalSiswa} icon={Users} tone="primary" />
        <StatCard label="PKL Aktif" value={totalPklAktif} icon={Briefcase} tone="success" />
        <StatCard
          label="Jurnal Perlu Review"
          value={totalJurnalPending}
          icon={Clock3}
          tone="warning"
        />
      </div>

      <SectionCard title="Menu Cepat" icon={BookOpen}>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/perusahaan/siswa" className="btn btn-outline-primary w-full">
            Siswa PKL
          </Link>
          <Link href="/perusahaan/jurnal" className="btn btn-outline-warning w-full">
            Jurnal Siswa
          </Link>
          <Link href="/perusahaan/penilaian" className="btn btn-outline-success w-full">
            Penilaian
          </Link>
        </div>
      </SectionCard>
    </>
  );
}
