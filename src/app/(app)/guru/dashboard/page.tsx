import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, Clock3, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, PklStatusBadge, SectionCard, StatCard } from "@/components/ui";

export const metadata = { title: "Dashboard Guru" };

export default async function GuruDashboardPage() {
  const user = await requireRole("guru");
  if (!user.guru) redirect("/forbidden");
  const guruId = user.guru.id;

  const [pkl, totalJurnalPending, totalJurnalDisetujui] = await Promise.all([
    prisma.pkl.findMany({
      where: { guruId },
      orderBy: { createdAt: "desc" },
      include: {
        siswa: { include: { user: true } },
        perusahaan: { include: { user: true } },
      },
    }),
    prisma.jurnal.count({ where: { pkl: { guruId }, statusDosen: "pending" } }),
    prisma.jurnal.count({ where: { pkl: { guruId }, statusDosen: "disetujui" } }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard Guru" subtitle="Ringkasan bimbingan PKL dan jurnal siswa." />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Siswa Bimbingan" value={pkl.length} icon={Users} tone="primary" />
        <StatCard label="Jurnal Pending" value={totalJurnalPending} icon={Clock3} tone="warning" />
        <StatCard
          label="Jurnal Disetujui"
          value={totalJurnalDisetujui}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="mb-4">
        <SectionCard title="Menu Cepat" icon={BookOpen}>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/guru/siswa" className="btn btn-outline-primary w-full">
              Siswa Bimbingan
            </Link>
            <Link href="/guru/jurnal" className="btn btn-outline-warning w-full">
              Jurnal Siswa
            </Link>
            <Link href="/guru/penilaian" className="btn btn-outline-success w-full">
              Penilaian
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Daftar Siswa Bimbingan">
        {pkl.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama</th>
                  <th>Judul PKL</th>
                  <th>Perusahaan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pkl.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.siswa.nis}</td>
                    <td>{item.siswa.user.name}</td>
                    <td>{item.judul}</td>
                    <td>{item.perusahaan?.user.name ?? "-"}</td>
                    <td>
                      <PklStatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada siswa bimbingan.</p>
        )}
      </SectionCard>
    </>
  );
}
