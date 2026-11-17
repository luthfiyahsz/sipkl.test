import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { forgotPasswordAction } from "@/actions/auth";
import { Send } from "lucide-react";

export const metadata = { title: "Lupa Password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <h2 className="text-center text-lg font-bold text-slate-800">Lupa Password</h2>
      <p className="mt-1 text-center text-sm text-slate-500">
        Masukkan email terdaftar. Kami akan mengirim tautan reset password.
      </p>

      <form action={forgotPasswordAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input id="email" name="email" type="email" required className="form-control" />
        </div>
        <SubmitButton className="btn btn-primary w-full" pendingLabel="Mengirim...">
          <Send size={16} /> Kirim Tautan Reset
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Kembali ke Login
        </Link>
      </p>
    </AuthShell>
  );
}
