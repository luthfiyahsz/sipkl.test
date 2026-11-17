import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DetailPage } from "@/components/detail-page";
import { KeyValue, PklStatusBadge, SectionCard } from "@/components/ui";

export const metadata = { title: "Detail Perusahaan" };

export default async function AdminPerusahaanShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const id = Number((await params).id);
  const perusahaan = Number.isInteger(id)
    ? await prisma.perusahaan.findUnique({
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
  if (!perusahaan) notFound();

  return (
    <DetailPage title="Detail Perusahaan" backHref="/admin/perusahaan">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Informasi Perusahaan">
          <KeyValue
            items={[
              { label: "Nama", value: <span className="font-bold">{perusahaan.user.name}</span> },
              { label: "Email", value: perusahaan.user.email },
              { label: "Kontak Person", value: perusahaan.kontakPerson ?? "-" },
              { label: "No. Telp", value: perusahaan.user.noTelp ?? "-" },
              {
                label: "Website",
                value: perusahaan.website ? (
                  <a
                    href={perusahaan.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand-700 hover:underline"
                  >
                    {perusahaan.website}
                  </a>
                ) : (
                  "-"
                ),
              },
              { label: "Alamat", value: perusahaan.user.alamat ?? "-" },
            ]}
          />
        </SectionCard>

        <SectionCard title="PKL di Perusahaan Ini">
          {perusahaan.pkls.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Judul</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {perusahaan.pkls.map((pkl) => (
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
            <p className="text-sm text-slate-500">Belum ada PKL.</p>
          )}
        </SectionCard>
      </div>
    </DetailPage>
  );
}
