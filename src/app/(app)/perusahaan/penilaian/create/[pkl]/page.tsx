import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { savePenilaianAction } from "@/actions/perusahaan";
import { ScoreForm } from "@/components/score-form";
import { KeyValue, PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Beri Penilaian" };

export default async function PerusahaanPenilaianCreatePage({
  params,
}: {
  params: Promise<{ pkl: string }>;
}) {
  const user = await requireRole("perusahaan");
  if (!user.perusahaan) redirect("/forbidden");
  const pklId = Number((await params).pkl);
  const pkl = Number.isInteger(pklId)
    ? await prisma.pkl.findUnique({
        where: { id: pklId },
        include: { siswa: { include: { user: true } } },
      })
    : null;
  if (!pkl) notFound();
  if (pkl.perusahaanId !== user.perusahaan.id) redirect("/forbidden");

  return (
    <>
      <PageHeader
        title="Beri Penilaian"
        actions={
          <Link href="/perusahaan/penilaian" className="btn btn-secondary">
            Kembali
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Informasi PKL">
          <KeyValue
            items={[
              { label: "Siswa", value: <span className="font-bold">{pkl.siswa.user.name}</span> },
              { label: "NIS", value: pkl.siswa.nis },
              { label: "Judul", value: pkl.judul },
            ]}
          />
        </SectionCard>
        <div className="lg:col-span-2">
          <SectionCard title="Form Penilaian">
            <ScoreForm action={savePenilaianAction} pklId={pkl.id} submitLabel="Simpan Penilaian" />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
