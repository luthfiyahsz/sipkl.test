import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DataTable } from "@/components/data-table";
import { PageHeader, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Pengajuan PKL" };

export default async function SiswaPklPage() {
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

  return (
    <>
      <PageHeader
        title="Pengajuan PKL"
        actions={
          <Link href="/siswa/pkl/create" className="btn btn-primary">
            <Plus size={16} /> Ajukan PKL
          </Link>
        }
      />
      <SectionCard title="Daftar Pengajuan">
        <DataTable
          columns={["No", "Judul", "Guru", "Perusahaan", "Status", "Aksi"]}
          searchPlaceholder="Cari PKL..."
          empty="Belum ada pengajuan PKL."
          rows={pkl.map((item, index) => ({
            key: String(item.id),
            search: `${item.judul} ${item.guru?.user.name ?? ""} ${item.perusahaan?.user.name ?? ""} ${item.status}`,
            cells: [
              index + 1,
              item.judul,
              item.guru?.user.name ?? "-",
              item.perusahaan?.user.name ?? "-",
              <PklStatusBadge key={`status-${item.id}`} status={item.status} />,
              <span key={`aksi-${item.id}`} className="flex items-center gap-1.5">
                <Link href={`/siswa/pkl/${item.id}`} className="btn btn-sm btn-info" title="Detail">
                  <Eye size={14} />
                </Link>
                {item.status === "pengajuan" && (
                  <Link
                    href={`/siswa/pkl/${item.id}/edit`}
                    className="btn btn-sm btn-warning"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                )}
              </span>,
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
