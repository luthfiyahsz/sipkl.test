import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  redirect(homeForRole(user.role));
}
