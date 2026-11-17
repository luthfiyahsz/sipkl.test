import { z } from "zod";

export const emailField = z
  .string({ required_error: "Email wajib diisi." })
  .trim()
  .toLowerCase()
  .email("Format email tidak valid.")
  .max(255, "Email maksimal 255 karakter.");

export const passwordField = z
  .string({ required_error: "Password wajib diisi." })
  .min(8, "Password minimal 8 karakter.")
  .max(255, "Password maksimal 255 karakter.");

export const nameField = z
  .string({ required_error: "Nama wajib diisi." })
  .trim()
  .min(1, "Nama wajib diisi.")
  .max(255, "Nama maksimal 255 karakter.");

export const optionalText = z
  .string()
  .trim()
  .max(5000, "Teks terlalu panjang.")
  .optional()
  .transform((value) => (value ? value : undefined));

export const optionalShort = z
  .string()
  .trim()
  .max(255, "Teks maksimal 255 karakter.")
  .optional()
  .transform((value) => (value ? value : undefined));

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data yang dikirim tidak valid.";
}

export function safeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = safeString(value).trim();
  return text.length > 0 ? text : undefined;
}
