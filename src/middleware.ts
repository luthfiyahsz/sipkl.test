import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { homeForRole, roleForPath } from "@/lib/roles";

const SESSION_COOKIE = "si_pkl_session";
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/admin", "/siswa", "/guru", "/perusahaan"];

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  let session: { role: string } | null = null;
  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
        algorithms: ["HS256"],
      });
      session = { role: String(payload.role ?? "") };
    } catch {
      session = null;
    }
  }

  // Sudah login lalu membuka halaman auth -> langsung ke dashboard sesuai role.
  if (session && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Belum login -> login, simpan tujuan semula.
  if (!session && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/dashboard") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  // Role tidak cocok -> 403.
  if (session) {
    const requiredRole = roleForPath(pathname);
    if (requiredRole && session.role !== requiredRole && pathname !== "/forbidden") {
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
