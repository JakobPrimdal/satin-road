import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { VendorMark } from "@/components/market/VendorMark";
import { Spinner } from "@/components/ui";
import { shortId } from "@/lib/format";

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line px-6 py-14 text-center">
      <p className="text-lg font-medium tracking-tight">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{body}</p>}
      {children}
    </div>
  );
}

const statusStyle: Record<string, { label: string; className: string }> = {
  Approved: { label: "Live", className: "border-accent/30 text-accent" },
  Pending: { label: "Waiting for approval", className: "border-line-strong text-muted" },
  Rejected: { label: "Rejected", className: "border-danger/30 text-danger" },
};

export function StatusPill({ status }: { status: string }) {
  const style = statusStyle[status] ?? { label: status, className: "border-line-strong text-muted" };
  return <span className={`shrink-0 rounded border px-1.5 py-px text-[11px] ${style.className}`}>{style.label}</span>;
}

export function Person({ id, name, role, link = true }: { id: string; name?: string; role: "Vendor" | "Buyer"; link?: boolean }) {
  const content = (
    <>
      <VendorMark vendorId={id} className="size-4 rounded-sm" />
      {role} {name ? <span className="text-muted">{name}</span> : <span className="font-mono">{shortId(id)}</span>}
    </>
  );
  if (!link || role !== "Vendor") return <span className="flex w-fit items-center gap-1.5 text-[13px] text-faint">{content}</span>;
  return (
    <Link
      to={`/market?vendor=${id}`}
      className="flex w-fit items-center gap-1.5 rounded text-[13px] text-faint underline-offset-4 outline-none hover:text-muted hover:underline focus-visible:underline"
    >
      {content}
    </Link>
  );
}

export function LoadingRows({ count = 4, height = "h-20" }: { count?: number; height?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${height} rounded-lg bg-surface`} />
      ))}
    </div>
  );
}

const actionBase =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-progress disabled:opacity-60";

const actionTones = {
  primary: "bg-fg text-canvas hover:bg-white",
  quiet: "text-muted hover:bg-field hover:text-fg",
  danger: "text-danger hover:bg-danger/10",
};

export function ActionButton({
  tone = "quiet",
  busy = false,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { tone?: keyof typeof actionTones; busy?: boolean }) {
  return (
    <button type="button" {...props} disabled={busy || props.disabled} className={`${actionBase} ${actionTones[tone]}`}>
      {busy && <Spinner />}
      {children}
    </button>
  );
}
