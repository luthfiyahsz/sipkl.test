import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { loginAction } from "@/actions/auth";
import { LogIn } from "lucide-react";

export const metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "";

  return (
    <AuthShell>
      <h2 className="text-center text-lg font-bold text-slate-800">Login</h2>
      <p className="mt-1 text-center text-sm text-slate-500">
        Masuk menggunakan akun yang diberikan admin.
      </p>

      <form action={loginAction} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            className="form-control"
            placeholder="nama@sekolah.sch.id"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="form-control"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
            Lupa password?
          </Link>
        </div>

        <SubmitButton className="btn btn-primary w-full" pendingLabel="Memproses...">
          <LogIn size={16} /> Login
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
