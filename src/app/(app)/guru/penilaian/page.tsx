import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DataTable } from "@/components/data-table";
import { PageHeader, ScoreBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Penilaian PKL" };

export default async function GuruPenilaianPage() {
  const user = await requireRole("guru");
  if (!user.guru) redirect("/forbidden");
  const guruId = user.guru.id;

  const [penilaian, belumDinilai] = await Promise.all([
    prisma.penilaian.findMany({
      where: { guruId },
      orderBy: { createdAt: "desc" },
      include: { pkl: { include: { siswa: { include: { user: true } } } } },
    }),
    prisma.pkl.findMany({
      where: { guruId, penilaians: { none: { guruId } } },
      orderBy: { createdAt: "desc" },
      include: { siswa: { include: { user: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Penilaian PKL" subtitle="Penilaian siswa bimbingan Anda." />

      {belumDinilai.length > 0 && (
        <div className="mb-4">
          <SectionCard title="Belum Dinilai">
            <DataTable
              columns={["No", "Siswa", "Judul PKL", "Aksi"]}
              searchPlaceholder="Cari PKL..."
              empty="Semua PKL bimbingan sudah dinilai."
              rows={belumDinilai.map((item, index) => ({
                key: String(item.id),
                search: `${item.siswa.user.name} ${item.judul}`,
                cells: [
                  index + 1,
                  item.siswa.user.name,
                  item.judul,
                  <Link
                    key={`nilai-${item.id}`}
                    href={`/guru/penilaian/create/${item.id}`}
                    className="btn btn-sm btn-success"
                  >
                    <Plus size={14} /> Beri Nilai
                  </Link>,
                ],
              }))}
            />
          </SectionCard>
        </div>
      )}

      <SectionCard title="Daftar Penilaian">
        <DataTable
          columns={["No", "Siswa", "Judul PKL", "Nilai", "Aksi"]}
          searchPlaceholder="Cari penilaian..."
          empty="Belum ada penilaian."
          rows={penilaian.map((item, index) => ({
            key: String(item.id),
            search: `${item.pkl.siswa.user.name} ${item.pkl.judul}`,
            cells: [
              index + 1,
              item.pkl.siswa.user.name,
              item.pkl.judul,
              <ScoreBadge key={`nilai-${item.id}`} score={item.totalNilai} />,
              <Link
                key={`aksi-${item.id}`}
                href={`/guru/penilaian/${item.id}/edit`}
                className="btn btn-sm btn-warning"
                title="Edit"
              >
                <Pencil size={14} />
              </Link>,
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
