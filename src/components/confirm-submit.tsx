"use client";

import type { ReactNode } from "react";

export function ConfirmSubmit({
  message,
  className = "btn btn-sm btn-danger",
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
