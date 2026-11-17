import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.name, role: user.role as AppRole }}>{children}</AppShell>
  );
}
