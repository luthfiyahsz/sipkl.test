import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deletePerusahaanAction } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DataTable } from "@/components/data-table";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Data Perusahaan" };

export default async function AdminPerusahaanPage() {
  await requireRole("admin");
  const perusahaan = await prisma.perusahaan.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Data Perusahaan"
        actions={
          <Link href="/admin/perusahaan/create" className="btn btn-primary">
            <Plus size={16} /> Tambah
          </Link>
        }
      />
      <SectionCard title="Daftar Perusahaan">
        <DataTable
          columns={["No", "Nama", "Email", "Kontak Person", "No. Telp", "Website", "Aksi"]}
          searchPlaceholder="Cari perusahaan..."
          empty="Belum ada data perusahaan."
          rows={perusahaan.map((item, index) => ({
            key: String(item.id),
            search: `${item.user.name} ${item.user.email} ${item.kontakPerson ?? ""} ${item.website ?? ""}`,
            cells: [
              index + 1,
              item.user.name,
              item.user.email,
              item.kontakPerson ?? "-",
              item.user.noTelp ?? "-",
              item.website ? (
                <a
                  key={`web-${item.id}`}
                  href={item.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-700 hover:underline"
                >
                  {item.website}
                </a>
              ) : (
                "-"
              ),
              <span key={`aksi-${item.id}`} className="flex items-center gap-1.5">
                <Link
                  href={`/admin/perusahaan/${item.id}`}
                  className="btn btn-sm btn-info"
                  title="Detail"
                >
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/perusahaan/${item.id}/edit`}
                  className="btn btn-sm btn-warning"
                  title="Edit"
                >
                  <Pencil size={14} />
                </Link>
                <form action={deletePerusahaanAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmit message="Hapus perusahaan ini? Data akan dihapus permanen.">
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
