"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export type DataTableRow = {
  key: string;
  search: string;
  cells: ReactNode[];
};

export function DataTable({
  columns,
  rows,
  empty = "Belum ada data.",
  pageSize = 10,
  searchPlaceholder = "Cari data...",
}: {
  columns: string[];
  rows: DataTableRow[];
  empty?: string;
  pageSize?: number;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => row.search.toLowerCase().includes(term));
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="form-control pl-9"
            aria-label="Cari data tabel"
          />
        </div>
        <p className="text-xs text-slate-500">
          Menampilkan {visible.length} dari {filtered.length} data
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length > 0 ? (
              visible.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={safePage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>
          <span className="text-xs text-slate-500">
            Halaman {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={safePage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Berikutnya <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
