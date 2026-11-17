import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deleteJurnalAction } from "@/actions/siswa";
import { formatDate, truncate } from "@/lib/format";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DataTable } from "@/components/data-table";
import { ApprovalBadge, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Jurnal Harian" };

export default async function SiswaJurnalPage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");

  const jurnal = await prisma.jurnal.findMany({
    where: { pkl: { siswaId: user.siswa.id } },
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    include: { pkl: true },
  });

  return (
    <>
      <PageHeader
        title="Jurnal Harian"
        actions={
          <Link href="/siswa/jurnal/create" className="btn btn-primary">
            <Plus size={16} /> Tambah Jurnal
          </Link>
        }
      />
      <SectionCard title="Daftar Jurnal">
        <DataTable
          columns={["No", "Tanggal", "PKL", "Kegiatan", "Status Dosen", "Status Perusahaan", "Aksi"]}
          searchPlaceholder="Cari jurnal..."
          empty="Belum ada jurnal harian."
          rows={jurnal.map((item, index) => ({
            key: String(item.id),
            search: `${formatDate(item.tanggal)} ${item.pkl.judul} ${item.kegiatan}`,
            cells: [
              index + 1,
              formatDate(item.tanggal),
              item.pkl.judul,
              truncate(item.kegiatan, 50),
              <ApprovalBadge key={`dosen-${item.id}`} status={item.statusDosen} />,
              <ApprovalBadge key={`perusahaan-${item.id}`} status={item.statusPerusahaan} />,
              <span key={`aksi-${item.id}`} className="flex items-center gap-1.5">
                <Link
                  href={`/siswa/jurnal/${item.id}/edit`}
                  className="btn btn-sm btn-warning"
                  title="Edit"
                >
                  <Pencil size={14} />
                </Link>
                <form action={deleteJurnalAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmit message="Hapus jurnal ini? Data akan dihapus permanen.">
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
