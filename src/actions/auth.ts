"use server";

import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getClientIp,
  hashPassword,
  homeForRole,
  verifyPassword,
  appUrl,
} from "@/lib/auth";
import { prismaErrorMessage, redirectError, redirectSuccess } from "@/lib/errors";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { emailField, firstIssue, nameField, passwordField, safeString } from "@/lib/validation";

function safeNext(value: string, fallback: string): string {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return fallback;
}

function authPath(page: string, next?: string): string {
  if (next) return `${page}?next=${encodeURIComponent(next)}`;
  return page;
}

export async function loginAction(formData: FormData): Promise<never> {
  const email = safeString(formData.get("email")).trim().toLowerCase();
  const password = safeString(formData.get("password"));
  const remember = formData.get("remember") === "on";
  const next = safeString(formData.get("next"));

  const schema = z.object({ email: emailField, password: z.string().min(1, "Password wajib diisi.") });
  const parsed = schema.safeParse({ email, password });
  if (!parsed.success) {
    redirectError(authPath("/login", next), firstIssue(parsed.error));
  }

  const ip = await getClientIp();
  const key = `login:${ip}:${email}`;
  const limit = rateLimit(key, 5, 60_000);
  if (!limit.allowed) {
    redirectError(
      authPath("/login", next),
      `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active || !(await verifyPassword(password, user.password))) {
    redirectError(authPath("/login", next), "Email atau password salah.");
  }

  resetRateLimit(key);
  await createSession(user, remember);
  redirect(safeNext(next, homeForRole(user.role)));
}

export async function registerAction(formData: FormData): Promise<never> {
  const raw = {
    name: safeString(formData.get("name")),
    email: safeString(formData.get("email")),
    password: safeString(formData.get("password")),
    passwordConfirmation: safeString(formData.get("password_confirmation")),
  };

  const schema = z
    .object({
      name: nameField,
      email: emailField,
      password: passwordField,
      passwordConfirmation: z.string(),
    })
    .refine((value) => value.password === value.passwordConfirmation, {
      message: "Konfirmasi password tidak sama.",
      path: ["passwordConfirmation"],
    });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) redirectError("/register", firstIssue(parsed.error));

  try {
    const password = await hashPassword(parsed.data.password);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password,
          role: "siswa",
          active: true,
        },
      });
      await tx.siswa.create({
        data: {
          userId: created.id,
          nis: `SISWA${String(created.id).padStart(4, "0")}`,
        },
      });
      return created;
    });
    await createSession(user, false);
  } catch (error) {
    redirectError("/register", prismaErrorMessage(error));
  }

  redirectSuccess(homeForRole("siswa"), "Registrasi berhasil. Selamat datang!");
}

export async function logoutAction(): Promise<never> {
  await destroySession();
  redirect("/login");
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function forgotPasswordAction(formData: FormData): Promise<never> {
  const parsed = z.object({ email: emailField }).safeParse({
    email: safeString(formData.get("email")),
  });
  if (!parsed.success) redirectError("/forgot-password", firstIssue(parsed.error));

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && user.active) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.upsert({
      where: { email: user.email },
      update: { token: hashResetToken(token), createdAt: new Date() },
      create: { email: user.email, token: hashResetToken(token), createdAt: new Date() },
    });

    const link = `${appUrl()}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    try {
      await sendMail({
        to: user.email,
        subject: "Reset Password SI-PKL",
        text: `Halo ${user.name},\n\nKlik tautan berikut untuk mengatur ulang password Anda (berlaku 60 menit):\n${link}\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
        html: `<p>Halo ${user.name},</p><p>Klik tautan berikut untuk mengatur ulang password Anda (berlaku 60 menit):</p><p><a href="${link}">${link}</a></p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
      });
    } catch (error) {
      console.error("Gagal mengirim email reset password:", error);
    }
  }

  // Pesan generik untuk mencegah enumerasi email.
  redirectSuccess(
    "/forgot-password",
    "Jika email terdaftar, tautan reset password sudah dikirim. Periksa inbox/spam Anda.",
  );
}

export async function resetPasswordAction(formData: FormData): Promise<never> {
  const raw = {
    email: safeString(formData.get("email")),
    token: safeString(formData.get("token")),
    password: safeString(formData.get("password")),
    passwordConfirmation: safeString(formData.get("password_confirmation")),
  };

  const schema = z
    .object({
      email: emailField,
      token: z.string().min(10, "Token reset tidak valid."),
      password: passwordField,
      passwordConfirmation: z.string(),
    })
    .refine((value) => value.password === value.passwordConfirmation, {
      message: "Konfirmasi password tidak sama.",
      path: ["passwordConfirmation"],
    });

  const parsed = schema.safeParse(raw);
  const back = `/reset-password?token=${encodeURIComponent(raw.token)}&email=${encodeURIComponent(raw.email)}`;
  if (!parsed.success) redirectError(back, firstIssue(parsed.error));

  const record = await prisma.passwordResetToken.findUnique({
    where: { email: parsed.data.email },
  });
  const expired =
    !record?.createdAt || Date.now() - record.createdAt.getTime() > 60 * 60 * 1000;

  if (!record || record.token !== hashResetToken(parsed.data.token) || expired) {
    redirectError(back, "Token reset password tidak valid atau sudah kedaluwarsa.");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active) redirectError(back, "Akun tidak ditemukan atau tidak aktif.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordResetToken.delete({ where: { email: parsed.data.email } }),
  ]);

  redirectSuccess("/login", "Password berhasil diubah. Silakan login dengan password baru.");
}
