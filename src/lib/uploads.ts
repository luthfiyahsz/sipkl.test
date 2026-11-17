import "server-only";

import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB, sama dengan validasi Laravel.

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
};

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

export type UploadKind = "image" | "pdf";

export function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

function extensionOf(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function hasValidSignature(buffer: Buffer, kind: UploadKind): boolean {
  if (kind === "pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  return isJpeg || isPng;
}

export async function saveUpload(
  file: File,
  folder: string,
  prefix: string,
  kind: UploadKind,
): Promise<string> {
  if (!file || file.size === 0) throw new Error("File wajib dipilih.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Ukuran file maksimal 2 MB.");

  const ext = extensionOf(file.name);
  if (kind === "image" && !IMAGE_EXTENSIONS[file.type]) {
    throw new Error("File harus berupa gambar JPG atau PNG.");
  }
  if (kind === "image" && ![".jpg", ".jpeg", ".png"].includes(ext)) {
    throw new Error("Ekstensi gambar harus .jpg, .jpeg, atau .png.");
  }
  if (kind === "pdf" && (file.type !== "application/pdf" || ext !== ".pdf")) {
    throw new Error("Laporan akhir harus berupa file PDF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(buffer, kind)) {
    throw new Error("Isi file tidak sesuai dengan format yang diizinkan.");
  }

  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = path.join(uploadRoot(), safeFolder);
  await mkdir(targetDir, { recursive: true });

  const filename = `${prefix}_${Date.now()}_${randomUUID()}${ext}`;
  await writeFile(path.join(targetDir, filename), buffer);
  return `${safeFolder}/${filename}`;
}

export async function deleteUpload(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;
  try {
    await unlink(resolveUploadPath(relativePath));
  } catch {
    // File sudah tidak ada: abaikan.
  }
}

/** Resolve path relatif dan cegah path traversal. */
export function resolveUploadPath(relativePath: string): string {
  const root = uploadRoot();
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Path file tidak valid.");
  }
  return resolved;
}

export async function readUpload(
  relativePath: string,
): Promise<{ data: Buffer; mime: string; size: number } | null> {
  try {
    const fullPath = resolveUploadPath(relativePath);
    const info = await stat(fullPath);
    if (!info.isFile()) return null;
    const data = await readFile(fullPath);
    const mime = MIME_BY_EXT[extensionOf(fullPath)] ?? "application/octet-stream";
    return { data, mime, size: info.size };
  } catch {
    return null;
  }
}

export function fileUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  return `/api/files/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}
