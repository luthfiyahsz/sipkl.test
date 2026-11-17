import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deleteGuruAction } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DataTable } from "@/components/data-table";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Data Guru" };

export default async function AdminGuruPage() {
  await requireRole("admin");
  const guru = await prisma.guru.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Data Guru"
        actions={
          <Link href="/admin/guru/create" className="btn btn-primary">
            <Plus size={16} /> Tambah
          </Link>
        }
      />
      <SectionCard title="Daftar Guru">
        <DataTable
          columns={["No", "NIP", "Nama", "Email", "Gelar", "No. Telp", "Aksi"]}
          searchPlaceholder="Cari guru..."
          empty="Belum ada data guru."
          rows={guru.map((item, index) => ({
            key: String(item.id),
            search: `${item.nip} ${item.user.name} ${item.user.email} ${item.gelar ?? ""}`,
            cells: [
              index + 1,
              item.nip,
              item.user.name,
              item.user.email,
              item.gelar ?? "-",
              item.user.noTelp ?? "-",
              <span key={`aksi-${item.id}`} className="flex items-center gap-1.5">
                <Link href={`/admin/guru/${item.id}`} className="btn btn-sm btn-info" title="Detail">
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/guru/${item.id}/edit`}
                  className="btn btn-sm btn-warning"
                  title="Edit"
                >
                  <Pencil size={14} />
                </Link>
                <form action={deleteGuruAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmit message="Hapus guru ini? Data akan dihapus permanen.">
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
