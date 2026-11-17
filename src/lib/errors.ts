import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

/** Ubah error Prisma yang umum menjadi pesan yang ramah pengguna. */
export function prismaErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[]).join(", ")
        : String(error.meta?.target ?? "data");
      return `Data sudah digunakan (${target}). Gunakan nilai lain.`;
    }
    if (error.code === "P2003") {
      return "Data masih berhubungan dengan data lain sehingga tidak dapat diproses.";
    }
    if (error.code === "P2025") {
      return "Data tidak ditemukan.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Terjadi kesalahan pada server. Silakan coba lagi.";
}

function withMessage(path: string, key: "success" | "error", message: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

export function redirectSuccess(path: string, message: string): never {
  redirect(withMessage(path, "success", message));
}

export function redirectError(path: string, message: string): never {
  redirect(withMessage(path, "error", message));
}

export function redirectMessage(path: string, result: { success?: string; error?: string }): never {
  if (result.error) redirectError(path, result.error);
  redirectSuccess(path, result.success ?? "Data berhasil disimpan.");
}
