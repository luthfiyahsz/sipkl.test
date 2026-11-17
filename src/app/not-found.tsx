import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="card w-full max-w-md">
        <div className="card-body text-center">
          <p className="text-5xl font-black text-brand-600">404</p>
          <h1 className="mt-2 text-xl font-bold text-slate-800">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
          </p>
          <Link href="/dashboard" className="btn btn-primary mt-5">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
