import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Akses Ditolak" };

export default function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="card w-full max-w-md">
        <div className="card-body text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
            <ShieldAlert size={28} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-800">403 - Akses Ditolak</h1>
          <p className="mt-2 text-sm text-slate-500">
            Role akun Anda tidak memiliki izin untuk membuka halaman ini.
          </p>
          <Link href="/dashboard" className="btn btn-primary mt-5">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
