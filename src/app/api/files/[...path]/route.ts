import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PklAccess = {
  siswaId: number;
  guruId: number | null;
  perusahaanId: number | null;
};

function canAccessPkl(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  pkl: PklAccess,
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "siswa") return user.siswa?.id === pkl.siswaId;
  if (user.role === "guru") return user.guru?.id === pkl.guruId;
  if (user.role === "perusahaan") return user.perusahaan?.id === pkl.perusahaanId;
  return false;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segments = (await params).path;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  // Cegah path traversal: setiap segmen harus berupa nama file/folder biasa.
  if (segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment) || segment === "..")) {
    return NextResponse.json({ error: "Path file tidak valid" }, { status: 400 });
  }

  const relativePath = segments.join("/");
  const folder = segments[0];

  if (folder === "foto") {
    // Foto profil dapat dilihat oleh semua pengguna yang sudah login.
  } else if (folder === "laporan") {
    const pkl = await prisma.pkl.findFirst({
      where: { laporanAkhir: relativePath },
      select: {
        siswaId: true,
        guruId: true,
        perusahaanId: true,
      },
    });
    if (!pkl || !canAccessPkl(user, pkl)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
  } else if (folder === "dokumentasi") {
    const jurnal = await prisma.jurnal.findFirst({
      where: { dokumentasi: relativePath },
      select: {
        pkl: {
          select: {
            siswaId: true,
            guruId: true,
            perusahaanId: true,
          },
        },
      },
    });
    if (!jurnal || !canAccessPkl(user, jurnal.pkl)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  const file = await readUpload(relativePath);
  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${segments[segments.length - 1]}"`,
    },
  });
}
