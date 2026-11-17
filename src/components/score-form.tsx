import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";

type ScoreValues = {
  id?: number;
  nilaiKedisiplinan: number | null;
  nilaiKerjasama: number | null;
  nilaiPengetahuan: number | null;
  nilaiKeterampilan: number | null;
  nilaiLaporan: number | null;
  komentar: string | null;
};

const FIELDS: Array<{ name: keyof ScoreValues; label: string }> = [
  { name: "nilaiKedisiplinan", label: "Kedisiplinan" },
  { name: "nilaiKerjasama", label: "Kerjasama" },
  { name: "nilaiPengetahuan", label: "Pengetahuan" },
  { name: "nilaiKeterampilan", label: "Keterampilan" },
  { name: "nilaiLaporan", label: "Laporan" },
];

const INPUT_NAMES: Record<string, string> = {
  nilaiKedisiplinan: "nilai_kedisiplinan",
  nilaiKerjasama: "nilai_kerjasama",
  nilaiPengetahuan: "nilai_pengetahuan",
  nilaiKeterampilan: "nilai_keterampilan",
  nilaiLaporan: "nilai_laporan",
};

export function ScoreForm({
  action,
  pklId,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<never>;
  pklId: number;
  values?: ScoreValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="pkl_id" value={pklId} />
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      {FIELDS.map((field) => {
        const inputName = INPUT_NAMES[field.name];
        return (
          <FormField key={field.name} label={`${field.label} (0-100)`} htmlFor={inputName} required>
            <input
              id={inputName}
              name={inputName}
              type="number"
              className="form-control"
              min={0}
              max={100}
              step={1}
              required
              defaultValue={values?.[field.name] ?? undefined}
            />
          </FormField>
        );
      })}
      <div className="md:col-span-2">
        <FormField label="Komentar" htmlFor="komentar">
          <textarea
            id="komentar"
            name="komentar"
            className="form-control"
            rows={3}
            defaultValue={values?.komentar ?? ""}
          />
        </FormField>
      </div>
      <div className="md:col-span-2">
        <SubmitButton pendingLabel="Menyimpan...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
