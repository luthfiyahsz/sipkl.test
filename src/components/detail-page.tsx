import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";

export function DetailPage({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title={title}
        actions={
          <a href={backHref} className="btn btn-secondary">
            Kembali
          </a>
        }
      />
      {children}
    </>
  );
}

export function ensureFound<T>(value: T | null): T {
  if (!value) notFound();
  return value;
}
