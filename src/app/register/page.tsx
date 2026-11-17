import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { registerAction } from "@/actions/auth";
import { UserPlus } from "lucide-react";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <AuthShell>
      <h2 className="text-center text-lg font-bold text-slate-800">Register</h2>
      <p className="mt-1 text-center text-sm text-slate-500">
        Pendaftaran mandiri membuat akun dengan role Siswa SMK.
      </p>

      <form action={registerAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="form-label">
            Nama Lengkap
          </label>
          <input id="name" name="name" type="text" required className="form-control" />
        </div>

        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input id="email" name="email" type="email" required className="form-control" />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            className="form-control"
          />
          <p className="form-hint">Minimal 8 karakter.</p>
        </div>

        <div>
          <label htmlFor="password_confirmation" className="form-label">
            Konfirmasi Password
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

        <SubmitButton className="btn btn-primary w-full" pendingLabel="Mendaftar...">
          <UserPlus size={16} /> Register
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
