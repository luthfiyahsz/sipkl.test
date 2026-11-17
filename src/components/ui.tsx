import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Inbox,
  TrendingUp,
} from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info" | "danger";
}) {
  const iconTone = {
    primary: "text-brand-500 bg-brand-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    info: "text-cyan-600 bg-cyan-50",
    danger: "text-rose-600 bg-rose-50",
  }[tone];

  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${iconTone}`}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "Belum ada data",
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Inbox size={24} />
      </span>
      <p className="font-medium text-slate-600">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {children}
    </div>
  );
}

export function PklStatusBadge({ status }: { status: string }) {
  const tone =
    status === "disetujui"
      ? "success"
      : status === "ditolak"
        ? "danger"
        : status === "selesai"
          ? "info"
          : "warning";
  return <span className={`badge badge-${tone}`}>{status}</span>;
}

export function ApprovalBadge({ status }: { status: string }) {
  const tone = status === "disetujui" ? "success" : status === "ditolak" ? "danger" : "warning";
  return <span className={`badge badge-${tone}`}>{status}</span>;
}

export function AbsensiBadge({ status }: { status: string }) {
  const tone =
    status === "hadir"
      ? "success"
      : status === "sakit"
        ? "warning"
        : status === "izin"
          ? "info"
          : "secondary";
  return <span className={`badge badge-${tone}`}>{status}</span>;
}

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <span className="text-slate-400">-</span>;
  const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  return <span className={`badge badge-${tone}`}>{score}</span>;
}

export function ErrorAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert-error">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InfoAlert({ message }: { message: string }) {
  return (
    <div className="alert alert-info">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="alert alert-success">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  actions,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-header">
        <span className="flex items-center gap-2">
          {Icon ? <Icon size={17} className="text-brand-600" /> : <ClipboardList size={17} />}
          {title}
        </span>
        {actions}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

export function KeyValue({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <table className="table table-borderless">
      <tbody>
        {items.map((item) => (
          <tr key={item.label}>
            <td className="w-40 align-top text-slate-500">{item.label}</td>
            <td className="font-medium text-slate-800">{item.value ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TrendNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
      <TrendingUp size={14} /> {children}
    </p>
  );
}
