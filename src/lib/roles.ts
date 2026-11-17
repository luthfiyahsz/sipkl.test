export type AppRole = "admin" | "siswa" | "guru" | "perusahaan";

export const ROLES: AppRole[] = ["admin", "siswa", "guru", "perusahaan"];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  siswa: "Siswa SMK",
  guru: "Guru",
  perusahaan: "Perusahaan",
};

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin/dashboard",
  siswa: "/siswa/dashboard",
  guru: "/guru/dashboard",
  perusahaan: "/perusahaan/dashboard",
};

export function isAppRole(value: string): value is AppRole {
  return (ROLES as string[]).includes(value);
}

export function homeForRole(role: string): string {
  return isAppRole(role) ? ROLE_HOME[role] : "/login";
}

/** Prefix URL yang dilindungi middleware, dipetakan ke role yang diizinkan. */
export const ROLE_ROUTES: Array<{ prefix: string; role: AppRole }> = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/siswa", role: "siswa" },
  { prefix: "/guru", role: "guru" },
  { prefix: "/perusahaan", role: "perusahaan" },
];

export function roleForPath(pathname: string): AppRole | null {
  const match = ROLE_ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  );
  return match?.role ?? null;
}
