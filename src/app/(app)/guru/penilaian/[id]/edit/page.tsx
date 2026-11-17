import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updatePenilaianAction } from "@/actions/guru";
import { ScoreForm } from "@/components/score-form";
import { KeyValue, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Edit Penilaian" };

export default async function GuruPenilaianEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("guru");
  if (!user.guru) redirect("/forbidden");
  const id = Number((await params).id);
  const penilaian = Number.isInteger(id)
    ? await prisma.penilaian.findUnique({
        where: { id },
        include: { pkl: { include: { siswa: { include: { user: true } } } } },
      })
    : null;
  if (!penilaian) notFound();
  if (penilaian.guruId !== user.guru.id) redirect("/forbidden");

  return (
    <>
      <PageHeader
        title="Edit Penilaian"
        actions={
          <Link href="/guru/penilaian" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Informasi PKL">
          <KeyValue
            items={[
              {
                label: "Siswa",
                value: <span className="font-bold">{penilaian.pkl.siswa.user.name}</span>,
              },
              { label: "NIS", value: penilaian.pkl.siswa.nis },
              { label: "Judul", value: penilaian.pkl.judul },
            ]}
          />
        </SectionCard>
        <div className="lg:col-span-2">
          <SectionCard title="Form Penilaian">
            <ScoreForm
              action={updatePenilaianAction}
              pklId={penilaian.pklId}
              values={{
                id: penilaian.id,
                nilaiKedisiplinan: penilaian.nilaiKedisiplinan,
                nilaiKerjasama: penilaian.nilaiKerjasama,
                nilaiPengetahuan: penilaian.nilaiPengetahuan,
                nilaiKeterampilan: penilaian.nilaiKeterampilan,
                nilaiLaporan: penilaian.nilaiLaporan,
                komentar: penilaian.komentar,
              }}
              submitLabel="Update Penilaian"
            />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
