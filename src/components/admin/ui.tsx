import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {breadcrumb && (
          <p className="mb-1 text-xs text-masaar-black/50">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.label}>
                {i > 0 && <span className="mx-1">›</span>}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              </span>
            ))}
          </p>
        )}
        <h1 className="text-2xl font-bold text-masaar-black">{title}</h1>
        {description && <p className="mt-1 text-sm text-masaar-black/60">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-black/10 bg-white p-6 ${className}`}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      {icon && (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-admin-surface text-admin-primary">
          {icon}
        </span>
      )}
      <div>
        <p className="text-sm text-masaar-black/60">{label}</p>
        <p className="text-2xl font-bold text-masaar-black">{value}</p>
      </div>
    </Card>
  );
}

const BADGE_STYLES: Record<string, string> = {
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-50 text-blue-700",
  gold: "bg-light-gold/20 text-deep-gold",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE_STYLES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_STYLES[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-admin-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-admin-primary-dark disabled:opacity-60"
      {...rest}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-admin-surface disabled:opacity-60"
      {...rest}
    >
      {children}
    </button>
  );
}

export function GoldButton({
  children,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-deep-gold px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pure-gold disabled:opacity-60"
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-masaar-black">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-masaar-black/50">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-admin-primary focus:outline-none";

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-masaar-black/50">
        {children}
      </td>
    </tr>
  );
}
