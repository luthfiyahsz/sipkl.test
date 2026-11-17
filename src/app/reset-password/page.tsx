import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { resetPasswordAction } from "@/actions/auth";
import { InfoAlert } from "@/components/ui";
import { KeyRound } from "lucide-react";

export const metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const email = params.email ?? "";
  const valid = token.length > 0 && email.length > 0;

  return (
    <AuthShell>
      <h2 className="text-center text-lg font-bold text-slate-800">Reset Password</h2>
      <p className="mt-1 text-center text-sm text-slate-500">
        Buat password baru untuk akun Anda.
      </p>

      {!valid && (
        <div className="mt-4">
          <InfoAlert message="Tautan reset tidak lengkap. Silakan minta tautan baru melalui halaman lupa password." />
        </div>
      )}

      {valid && (
        <form action={resetPasswordAction} className="mt-5 space-y-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />
          <div>
            <label htmlFor="email_display" className="form-label">
              Email
            </label>
            <input
              id="email_display"
              type="email"
              value={email}
              disabled
              className="form-control bg-slate-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="form-label">
              Password Baru
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="form-control"
            />
          </div>
          <div>
            <label htmlFor="password_confirmation" className="form-label">
              Konfirmasi Password Baru
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              minLength={8}
              required
              className="form-control"
            />
          </div>
          <SubmitButton className="btn btn-primary w-full" pendingLabel="Menyimpan...">
            <KeyRound size={16} /> Simpan Password
          </SubmitButton>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Kembali ke Login
        </Link>
      </p>
    </AuthShell>
  );
}
