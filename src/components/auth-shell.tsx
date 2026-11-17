import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
            <GraduationCap size={34} />
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-wide">SI-PKL</h1>
          <p className="text-sm text-white/70">Sistem Informasi Praktik Kerja Lapangan</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white p-6 shadow-2xl sm:p-8">
          {children}
        </div>
        <p className="mt-5 text-center text-xs text-white/50">
          &copy; {new Date().getFullYear()} SI-PKL. Hak akses berbasis role.
        </p>
      </div>
    </div>
  );
}
