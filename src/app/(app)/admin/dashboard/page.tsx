import Link from "next/link";
import { Briefcase, Building2, FileText, UserSquare2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DataTable } from "@/components/data-table";
import { PageHeader, PklStatusBadge, SectionCard, StatCard } from "@/components/ui";

export const metadata = { title: "Dashboard Admin" };

function joinNames(values: Array<string | null | undefined>): string {
  return values.filter(Boolean).join(", ") || "-";
}

export default async function AdminDashboardPage() {
  await requireRole("admin");

  const [totalSiswa, totalGuru, totalPerusahaan, totalPkl, totalJurnal, pklMenunggu, siswaList] =
    await Promise.all([
      prisma.siswa.count(),
      prisma.guru.count(),
      prisma.perusahaan.count(),
      prisma.pkl.count(),
      prisma.jurnal.count(),
      prisma.pkl.count({ where: { status: "pengajuan" } }),
      prisma.siswa.findMany({
        include: {
          user: true,
          pkls: {
            orderBy: { createdAt: "desc" },
            include: {
              guru: { include: { user: true } },
              perusahaan: { include: { user: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <>
      <PageHeader title="Dashboard Admin" subtitle="Ringkasan data Sistem Informasi PKL." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Siswa SMK" value={totalSiswa} icon={Users} tone="primary" />
        <StatCard label="Guru" value={totalGuru} icon={UserSquare2} tone="success" />
        <StatCard label="Perusahaan" value={totalPerusahaan} icon={Building2} tone="warning" />
        <StatCard label="Total PKL" value={totalPkl} icon={Briefcase} tone="info" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi Umum" icon={FileText}>
          <table className="table table-borderless">
            <tbody>
              <tr>
                <td>Total Jurnal</td>
                <td className="font-bold">{totalJurnal}</td>
              </tr>
              <tr>
                <td>PKL Menunggu Persetujuan</td>
                <td className="font-bold text-amber-600">{pklMenunggu}</td>
              </tr>
            </tbody>
          </table>
        </SectionCard>
      </div>

      <SectionCard title="Daftar Semua Siswa">
        <DataTable
          columns={["No", "NIS", "Nama", "Kelas", "Judul PKL", "Guru", "Perusahaan", "Status PKL"]}
          searchPlaceholder="Cari siswa..."
          empty="Belum ada data siswa."
          rows={siswaList.map((siswa, index) => ({
            key: String(siswa.id),
            search: `${siswa.nis} ${siswa.user.name} ${siswa.user.email} ${siswa.kelas ?? ""}`,
            cells: [
              index + 1,
              siswa.nis,
              <Link
                key={`name-${siswa.id}`}
                href={`/admin/siswa/${siswa.id}`}
                className="font-medium text-brand-700 hover:underline"
              >
                {siswa.user.name}
              </Link>,
              siswa.kelas ?? "-",
              joinNames(siswa.pkls.map((pkl) => pkl.judul)),
              joinNames(siswa.pkls.map((pkl) => pkl.guru?.user.name)),
              joinNames(siswa.pkls.map((pkl) => pkl.perusahaan?.user.name)),
              <span key={`status-${siswa.id}`} className="flex flex-wrap gap-1">
                {siswa.pkls.length > 0 ? (
                  siswa.pkls.map((pkl) => <PklStatusBadge key={pkl.id} status={pkl.status} />)
                ) : (
                  "-"
                )}
              </span>,
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
