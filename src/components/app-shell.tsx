"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Star,
  UserRound,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { title?: string; items: NavItem[] };

const NAV: Record<AppRole, NavSection[]> = {
  admin: [
    { items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }] },
    {
      title: "Master Data",
      items: [
        { label: "Siswa SMK", href: "/admin/siswa", icon: Users },
        { label: "Guru", href: "/admin/guru", icon: UserSquare2 },
        { label: "Perusahaan", href: "/admin/perusahaan", icon: Building2 },
      ],
    },
    {
      title: "Transaksi",
      items: [
        { label: "Data PKL", href: "/admin/pkl", icon: Briefcase },
        { label: "Jurnal Harian", href: "/admin/jurnal", icon: BookOpen },
        { label: "Penilaian", href: "/admin/penilaian", icon: Star },
        { label: "Absensi", href: "/admin/absensi", icon: CalendarCheck },
      ],
    },
  ],
  siswa: [
    { items: [{ label: "Dashboard", href: "/siswa/dashboard", icon: LayoutDashboard }] },
    {
      items: [
        { label: "Pengajuan PKL", href: "/siswa/pkl", icon: Briefcase },
        { label: "Jurnal Harian", href: "/siswa/jurnal", icon: BookOpen },
        { label: "Absensi", href: "/siswa/absensi", icon: CalendarCheck },
        { label: "Profil Saya", href: "/siswa/profil", icon: UserRound },
      ],
    },
  ],
  guru: [
    { items: [{ label: "Dashboard", href: "/guru/dashboard", icon: LayoutDashboard }] },
    {
      items: [
        { label: "Siswa Bimbingan", href: "/guru/siswa", icon: Users },
        { label: "Jurnal Siswa", href: "/guru/jurnal", icon: BookOpen },
        { label: "Penilaian", href: "/guru/penilaian", icon: Star },
      ],
    },
  ],
  perusahaan: [
    { items: [{ label: "Dashboard", href: "/perusahaan/dashboard", icon: LayoutDashboard }] },
    {
      items: [
        { label: "Siswa PKL", href: "/perusahaan/siswa", icon: Users },
        { label: "Jurnal Siswa", href: "/perusahaan/jurnal", icon: BookOpen },
        { label: "Penilaian", href: "/perusahaan/penilaian", icon: Star },
      ],
    },
  ],
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: AppRole };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sections = NAV[user.role];

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
    } else {
      setMobileOpen((value) => !value);
    }
  }

  return (
    <div className={`app-wrapper ${collapsed ? "sidebar-collapsed" : ""}`}>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="sidebar-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu samping"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/80">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 font-semibold text-white">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-white">{user.name}</span>
            <span className="block text-[11px] text-white/60">{ROLE_LABEL[user.role]}</span>
          </span>
        </div>

        <nav className="flex-1">
          {sections.map((section, index) => (
            <div key={`${section.title ?? "main"}-${index}`}>
              {section.title && <p className="nav-section">{section.title}</p>}
              <ul className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`nav-link ${active ? "active" : ""}`}
                      >
                        <Icon size={17} className="shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight size={14} className="opacity-70" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-white/15 pt-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="nav-link w-full text-left text-rose-100 hover:bg-rose-500/20"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="page-content">
        <header className="topbar">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Buka/tutup menu samping"
          >
            <Menu size={20} />
          </button>

          <span className="hidden items-center gap-1.5 text-sm text-slate-400 sm:flex">
            <GraduationCap size={16} />
            SI-PKL
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="badge badge-info">{ROLE_LABEL[user.role]}</span>
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">{user.name}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {initials(user.name)}
            </span>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
