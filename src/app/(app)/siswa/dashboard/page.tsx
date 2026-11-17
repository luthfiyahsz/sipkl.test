import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Briefcase, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, PklStatusBadge, SectionCard, StatCard } from "@/components/ui";

export const metadata = { title: "Dashboard Siswa SMK" };

export default async function SiswaDashboardPage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");

  const pkl = await prisma.pkl.findMany({
    where: { siswaId: user.siswa.id },
    orderBy: { createdAt: "desc" },
    include: {
      guru: { include: { user: true } },
      perusahaan: { include: { user: true } },
    },
  });
  const totalJurnal = await prisma.jurnal.count({
    where: { pkl: { siswaId: user.siswa.id } },
  });
  const pklDisetujui = pkl.filter((item) => item.status === "disetujui").length;

  return (
    <>
      <PageHeader
        title="Dashboard Siswa SMK"
        subtitle="Ringkasan pengajuan PKL dan jurnal harian Anda."
        actions={<span className="badge badge-info text-sm">NIS {user.siswa.nis}</span>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total PKL" value={pkl.length} icon={Briefcase} tone="primary" />
        <StatCard label="PKL Disetujui" value={pklDisetujui} icon={CheckCircle2} tone="success" />
        <StatCard label="Total Jurnal" value={totalJurnal} icon={BookOpen} tone="info" />
      </div>

      <SectionCard title="Riwayat PKL">
        {pkl.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Guru</th>
                  <th>Perusahaan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pkl.map((item) => (
                  <tr key={item.id}>
                    <td>{item.judul}</td>
                    <td>{item.guru?.user.name ?? "-"}</td>
                    <td>{item.perusahaan?.user.name ?? "-"}</td>
                    <td>
                      <PklStatusBadge status={item.status} />
                    </td>
                    <td>
                      <Link href={`/siswa/pkl/${item.id}`} className="btn btn-sm btn-info">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Belum ada pengajuan PKL.{" "}
            <Link href="/siswa/pkl/create" className="text-brand-700 hover:underline">
              Ajukan sekarang
            </Link>
          </p>
        )}
      </SectionCard>
    </>
  );
}
