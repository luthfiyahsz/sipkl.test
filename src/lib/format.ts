const JAKARTA_TZ = "Asia/Jakarta";

/** Format tanggal dari MySQL DATE (UTC midnight) ke dd/mm/yyyy tanpa shift zona waktu. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Nilai untuk <input type="date">. */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Tanggal hari ini (zona Asia/Jakarta) sebagai objek UTC midnight untuk kolom DATE. */
export function todayDate(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00.000Z`);
}

export function todayInput(): string {
  return todayDate().toISOString().slice(0, 10);
}

export function parseDateInput(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}...`;
}

export function fullName(
  user: { name: string } | null | undefined,
  gelar?: string | null,
): string {
  if (!user) return "-";
  return gelar ? `${user.name}, ${gelar}` : user.name;
}
