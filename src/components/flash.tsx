"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type FlashMessage = { type: "success" | "error"; message: string };

export function Flash() {
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    if (!success && !error) return;

    setFlash(
      success
        ? { type: "success", message: success }
        : { type: "error", message: error ?? "" },
    );

    // Bersihkan query agar pesan tidak muncul lagi saat halaman di-refresh.
    params.delete("success");
    params.delete("error");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(timer);
  }, [flash]);

  if (!flash) return null;

  const success = flash.type === "success";
  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-[70] flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${
        success
          ? "border-emerald-200 bg-white text-emerald-800"
          : "border-rose-200 bg-white text-rose-800"
      }`}
    >
      {success ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
      )}
      <span className="flex-1">{flash.message}</span>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={() => setFlash(null)}
        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={16} />
      </button>
    </div>
  );
}
