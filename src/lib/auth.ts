import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { homeForRole, isAppRole, type AppRole } from "@/lib/roles";

export const SESSION_COOKIE = "si_pkl_session";

const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 hari
const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 8; // 8 jam

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET belum diatur atau terlalu pendek (minimal 32 karakter). Jalankan: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  user: { id: number; email: string; name: string; role: Role },
  remember = false,
): Promise<void> {
  const maxAge = remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Nginx host menangani TLS. Cookie hanya secure jika trafik ke browser HTTPS.
    secure: process.env.NODE_ENV === "production" && process.env.AUTH_COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.AUTH_COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });
    const role = String(payload.role ?? "");
    if (!payload.sub || !isAppRole(role)) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: role as Role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;

  const id = Number(session.sub);
  if (!Number.isInteger(id)) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      foto: true,
      noTelp: true,
      alamat: true,
      emailVerifiedAt: true,
      siswa: { select: { id: true, nis: true, kelas: true } },
      guru: { select: { id: true, nip: true, gelar: true } },
      perusahaan: { select: { id: true, kontakPerson: true, website: true } },
    },
  });

  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: AppRole | AppRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await requireUser();
  if (!allowed.includes(user.role as AppRole)) {
    redirect("/forbidden");
  }
  return user;
}

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function clientIpFrom(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headersList.get("x-real-ip") ?? "unknown";
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return clientIpFrom(headersList);
}

export { homeForRole };
