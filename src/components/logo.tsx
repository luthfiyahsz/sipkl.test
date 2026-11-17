import { GraduationCap } from "lucide-react";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 text-white no-underline">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
        <GraduationCap size={22} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-base font-semibold tracking-wide">SI-PKL</span>
          <span className="block text-[11px] text-white/60">Praktik Kerja Lapangan</span>
        </span>
      )}
    </Link>
  );
}
