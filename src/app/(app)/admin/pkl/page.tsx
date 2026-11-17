import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deletePklAction } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DataTable } from "@/components/data-table";
import { PageHeader, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Data PKL" };

export default async function AdminPklPage() {
  await requireRole("admin");
  const pkl = await prisma.pkl.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      siswa: { include: { user: true } },
      guru: { include: { user: true } },
      perusahaan: { include: { user: true } },
    },
  });

  return (
    <>
      <PageHeader title="Data PKL" subtitle="Semua pengajuan dan pelaksanaan PKL." />
      <SectionCard title="Daftar PKL">
        <DataTable
          columns={["No", "Siswa", "Judul", "Guru", "Perusahaan", "Status", "Aksi"]}
          searchPlaceholder="Cari PKL..."
          empty="Belum ada data PKL."
          rows={pkl.map((item, index) => ({
            key: String(item.id),
            search: `${item.siswa.user.name} ${item.judul} ${item.guru?.user.name ?? ""} ${item.perusahaan?.user.name ?? ""} ${item.status}`,
            cells: [
              index + 1,
              item.siswa.user.name,
              item.judul,
              item.guru?.user.name ?? "-",
              item.perusahaan?.user.name ?? "-",
              <PklStatusBadge key={`status-${item.id}`} status={item.status} />,
              <span key={`aksi-${item.id}`} className="flex items-center gap-1.5">
                <Link href={`/admin/pkl/${item.id}`} className="btn btn-sm btn-info" title="Detail">
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/pkl/${item.id}/edit`}
                  className="btn btn-sm btn-warning"
                  title="Edit status"
                >
                  <Pencil size={14} />
                </Link>
                <form action={deletePklAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmit message="Hapus PKL ini beserta jurnal dan penilaiannya?">
                    <Trash2 size={14} />
                  </ConfirmSubmit>
                </form>
              </span>,
            ],
          }))}
        />
      </SectionCard>
    </>
  );
}
