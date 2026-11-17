import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateProfilAction } from "@/actions/siswa";
import { fileUrl } from "@/lib/uploads";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, SectionCard } from "@/components/ui";

export const metadata = { title: "Profil Saya" };

export default async function SiswaProfilPage() {
  const user = await requireRole("siswa");
  if (!user.siswa) redirect("/forbidden");
  const siswa = await prisma.siswa.findUnique({
    where: { id: user.siswa.id },
    include: { user: true },
  });
  if (!siswa) redirect("/forbidden");

  const foto = fileUrl(siswa.user.foto);

  return (
    <>
      <PageHeader title="Profil Saya" />
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Foto Profil">
          <div className="flex flex-col items-center text-center">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto}
                alt={`Foto ${siswa.user.name}`}
                className="mb-3 h-40 w-40 rounded-full border-4 border-slate-100 object-cover"
              />
            ) : (
              <span className="mb-3 grid h-40 w-40 place-items-center rounded-full bg-slate-100 text-slate-300">
                <UserRound size={72} />
              </span>
            )}
            <h2 className="text-lg font-semibold text-slate-800">{siswa.user.name}</h2>
            <p className="text-sm text-slate-500">
              {siswa.nis} | {siswa.kelas ?? "-"}
            </p>
            <p className="mt-1 text-xs text-slate-400">{siswa.user.email}</p>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title="Edit Profil">
            <form action={updateProfilAction} className="grid gap-4 md:grid-cols-2">
              <FormField label="Nama" htmlFor="name" required>
                <input
                  id="name"
                  name="name"
                  className="form-control"
                  required
                  maxLength={255}
                  defaultValue={siswa.user.name}
                />
              </FormField>
              <FormField label="No. Telp" htmlFor="no_telp">
                <input
                  id="no_telp"
                  name="no_telp"
                  className="form-control"
                  maxLength={20}
                  defaultValue={siswa.user.noTelp ?? ""}
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Alamat" htmlFor="alamat">
                  <textarea
                    id="alamat"
                    name="alamat"
                    className="form-control"
                    rows={2}
                    defaultValue={siswa.user.alamat ?? ""}
                  />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField
                  label="Foto Profil"
                  htmlFor="foto"
                  hint="JPG/PNG, maksimal 2 MB."
                >
                  <input
                    id="foto"
                    name="foto"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="form-control"
                  />
                </FormField>
              </div>
              <FormField
                label="Password Baru"
                htmlFor="password"
                hint="Kosongkan jika tidak diubah. Minimal 8 karakter."
              >
                <input id="password" name="password" type="password" className="form-control" />
              </FormField>
              <FormField label="Konfirmasi Password" htmlFor="password_confirmation">
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  className="form-control"
                />
              </FormField>
              <div className="md:col-span-2">
                <SubmitButton pendingLabel="Menyimpan...">Simpan</SubmitButton>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
