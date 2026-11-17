"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingLabel,
  formNoValidate,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  formNoValidate?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} formNoValidate={formNoValidate}>
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {pendingLabel ?? "Menyimpan..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
