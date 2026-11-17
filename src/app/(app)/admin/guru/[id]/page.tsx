import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DetailPage } from "@/components/detail-page";
import { KeyValue, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Detail Guru" };

export default async function AdminGuruShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const guru = Number.isInteger(id)
    ? await prisma.guru.findUnique({
        where: { id },
        include: {
          user: true,
          pkls: {
            orderBy: { createdAt: "desc" },
            include: { siswa: { include: { user: true } } },
          },
        },
      })
    : null;
  if (!guru) notFound();

  return (
    <DetailPage title="Detail Guru" backHref="/admin/guru">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi Guru">
          <KeyValue
            items={[
              { label: "NIP", value: <span className="font-bold">{guru.nip}</span> },
              { label: "Nama", value: <span className="font-bold">{guru.user.name}</span> },
              { label: "Email", value: guru.user.email },
              { label: "Gelar", value: guru.gelar ?? "-" },
              { label: "No. Telp", value: guru.user.noTelp ?? "-" },
              { label: "Alamat", value: guru.user.alamat ?? "-" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Pembimbing PKL">
          {guru.pkls.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Judul</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {guru.pkls.map((pkl) => (
                  <tr key={pkl.id}>
                    <td>{pkl.siswa.user.name}</td>
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
            <p className="text-sm text-slate-500">Belum membimbing PKL.</p>
          )}
        </SectionCard>
      </div>
    </DetailPage>
  );
}
