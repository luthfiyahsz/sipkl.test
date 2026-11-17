import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deleteSiswaAction } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DataTable } from "@/components/data-table";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Data Siswa SMK" };

export default async function AdminSiswaPage() {
  await requireRole("admin");
  const siswa = await prisma.siswa.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Data Siswa SMK"
        actions={
          <Link href="/admin/siswa/create" className="btn btn-primary">
            <Plus size={16} /> Tambah
          </Link>
        }
      />
      <SectionCard title="Daftar Siswa">
        <DataTable
          columns={["No", "NIS", "Nama", "Email", "Kelas", "No. Telp", "Aksi"]}
          searchPlaceholder="Cari siswa..."
          empty="Belum ada data siswa."
          rows={siswa.map((item, index) => ({
            key: String(item.id),
            search: `${item.nis} ${item.user.name} ${item.user.email} ${item.kelas ?? ""} ${item.user.noTelp ?? ""}`,
            cells: [
              index + 1,
              item.nis,
              item.user.name,
              item.user.email,
              item.kelas ?? "-",
              item.user.noTelp ?? "-",
              <span key={`aksi-${item.id}`} className="flex items-center gap-1.5">
                <Link
                  href={`/admin/siswa/${item.id}`}
                  className="btn btn-sm btn-info"
                  title="Detail"
                >
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/siswa/${item.id}/edit`}
                  className="btn btn-sm btn-warning"
                  title="Edit"
                >
                  <Pencil size={14} />
                </Link>
                <form action={deleteSiswaAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmit message="Hapus siswa ini? Data akan dihapus permanen.">
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
