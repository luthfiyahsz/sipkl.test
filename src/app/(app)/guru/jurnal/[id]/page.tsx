import { notFound, redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  approveJurnalAction,
  commentJurnalAction,
  rejectJurnalAction,
} from "@/actions/guru";
import { formatDate } from "@/lib/format";
import { fileUrl } from "@/lib/uploads";
import { DetailPage } from "@/components/detail-page";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import {
  ApprovalBadge,
  InfoAlert,
  KeyValue,
  SectionCard,
} from "@/components/ui";

export const metadata = { title: "Detail Jurnal" };

export default async function GuruJurnalShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("guru");
  if (!user.guru) redirect("/forbidden");
  const id = Number((await params).id);
  const jurnal = Number.isInteger(id)
    ? await prisma.jurnal.findUnique({
        where: { id },
        include: {
          pkl: {
            include: {
              siswa: { include: { user: true } },
              perusahaan: { include: { user: true } },
            },
          },
        },
      })
    : null;
  if (!jurnal) notFound();
  if (jurnal.pkl.guruId !== user.guru.id) redirect("/forbidden");

  const dokumentasi = fileUrl(jurnal.dokumentasi);

  return (
    <DetailPage title="Detail Jurnal" backHref="/guru/jurnal">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Kegiatan Jurnal">
            <KeyValue
              items={[
                {
                  label: "Siswa",
                  value: <span className="font-bold">{jurnal.pkl.siswa.user.name}</span>,
                },
                { label: "Perusahaan", value: jurnal.pkl.perusahaan?.user.name ?? "-" },
                { label: "Tanggal", value: formatDate(jurnal.tanggal) },
                {
                  label: "Kegiatan",
                  value: <span className="whitespace-pre-line">{jurnal.kegiatan}</span>,
                },
                {
                  label: "Dokumentasi",
                  value: dokumentasi ? (
                    <a href={dokumentasi} target="_blank" rel="noreferrer noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dokumentasi}
                        alt={`Dokumentasi jurnal ${formatDate(jurnal.tanggal)}`}
                        className="h-48 w-auto rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  ) : (
                    "-"
                  ),
                },
                { label: "Status Dosen", value: <ApprovalBadge status={jurnal.statusDosen} /> },
              ]}
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Aksi">
            {jurnal.statusDosen === "disetujui" ? (
              <InfoAlert message="Jurnal ini sudah disetujui." />
            ) : (
              <form action={approveJurnalAction}>
                <input type="hidden" name="id" value={jurnal.id} />
                <SubmitButton className="btn btn-success w-full" pendingLabel="Menyetujui...">
                  <Check size={16} /> Setujui
                </SubmitButton>
              </form>
            )}
          </SectionCard>

          <SectionCard title="Komentar Dosen">
            <form action={commentJurnalAction} className="space-y-3">
              <input type="hidden" name="id" value={jurnal.id} />
              <FormField label="Komentar" htmlFor="komentar_dosen" required>
                <textarea
                  id="komentar_dosen"
                  name="komentar_dosen"
                  className="form-control"
                  rows={3}
                  defaultValue={jurnal.komentarDosen ?? ""}
                  required
                />
              </FormField>
              <SubmitButton
                className="btn btn-primary btn-sm"
                pendingLabel="Mengirim..."
              >
                Kirim Komentar
              </SubmitButton>
            </form>
          </SectionCard>

          <SectionCard title="Tolak Jurnal">
            <form action={rejectJurnalAction} className="space-y-3">
              <input type="hidden" name="id" value={jurnal.id} />
              <FormField label="Alasan Tolak" htmlFor="alasan_tolak" required>
                <textarea
                  id="alasan_tolak"
                  name="komentar_dosen"
                  className="form-control"
                  rows={2}
                  required
                />
              </FormField>
              <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Menolak...">
                <X size={16} /> Tolak
              </SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </DetailPage>
  );
}
