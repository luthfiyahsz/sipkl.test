import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DetailPage } from "@/components/detail-page";
import { KeyValue, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Detail Siswa SMK" };

export default async function AdminSiswaShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const siswa = Number.isInteger(id)
    ? await prisma.siswa.findUnique({
        where: { id },
        include: { user: true, pkls: { orderBy: { createdAt: "desc" } } },
      })
    : null;
  if (!siswa) notFound();

  return (
    <DetailPage title="Detail Siswa SMK" backHref="/admin/siswa">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi Siswa">
          <KeyValue
            items={[
              { label: "NIS", value: <span className="font-bold">{siswa.nis}</span> },
              { label: "Nama", value: <span className="font-bold">{siswa.user.name}</span> },
              { label: "Email", value: siswa.user.email },
              { label: "Kelas", value: siswa.kelas ?? "-" },
              { label: "No. Telp", value: siswa.user.noTelp ?? "-" },
              { label: "Alamat", value: siswa.user.alamat ?? "-" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Riwayat PKL">
          {siswa.pkls.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {siswa.pkls.map((pkl) => (
                  <tr key={pkl.id}>
                    <td>
                      <Link
                        href={`/admin/pkl/${pkl.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {pkl.judul}
                      </Link>
                    </td>
                    <td>
                      <PklStatusBadge status={pkl.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">Belum ada PKL.</p>
          )}
        </SectionCard>
      </div>
    </DetailPage>
  );
}
