import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { VendorMark } from "@/components/market/VendorMark";
import { Spinner } from "@/components/ui";
import { plural, shortId } from "@/lib/format";

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

export function usePageParam() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);

  function resetPage() {
    if (!params.has("page")) return;
    setParams(
      current => {
        const next = new URLSearchParams(current);
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  return { page, resetPage };
}

export interface Paged<T> {
  items: T[];
  page: number;
  count: number;
  start: number;
  total: number;
}

export function paginate<T>(items: T[], requested: number, size: number): Paged<T> {
  const count = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(requested, count);
  const start = (page - 1) * size;
  return { items: items.slice(start, start + size), page, count, start, total: items.length };
}

function pageList(page: number, count: number): (number | "gap")[] {
  const wanted = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach(p => wanted.add(p));
  if (page >= count - 3) [count - 4, count - 3, count - 2, count - 1].forEach(p => wanted.add(p));
  const pages = [...wanted].filter(p => p >= 1 && p <= count).sort((a, b) => a - b);

  const list: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    const previous = pages[i - 1];
    if (previous !== undefined && p - previous === 2) list.push(previous + 1);
    else if (previous !== undefined && p - previous > 2) list.push("gap");
    list.push(p);
  });
  return list;
}

const pageLinkClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] tabular-nums text-muted outline-none transition-colors hover:bg-field hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 aria-[current=page]:bg-raised aria-[current=page]:text-fg";

export function Pagination<T>({ paged, noun, nouns }: { paged: Paged<T>; noun: string; nouns?: string }) {
  const [params] = useSearchParams();
  const { page, count, start, total, items } = paged;
  if (count <= 1) return null;

  function to(p: number) {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const search = next.toString();
    return { search: search ? `?${search}` : "" };
  }

  const toTop = () => window.scrollTo(0, 0);

  function step(target: number, label: string, icon: ReactNode) {
    if (target < 1 || target > count) {
      return (
        <span aria-disabled="true" aria-label={label} className={`${pageLinkClass} pointer-events-none opacity-40`}>
          {icon}
        </span>
      );
    }
    return (
      <Link to={to(target)} onClick={toTop} aria-label={label} className={pageLinkClass}>
        {icon}
      </Link>
    );
  }

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p className="text-[13px] text-muted tabular-nums">
        {start + 1}–{start + items.length} of {plural(total, noun, nouns)}
      </p>
      <div className="flex items-center gap-1">
        {step(page - 1, "Previous page", <ChevronLeftIcon className="size-4" />)}
        <span className="px-2 text-[13px] text-muted tabular-nums sm:hidden">
          Page {page} of {count}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {pageList(page, count).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="w-6 text-center text-[13px] text-faint">
                …
              </span>
            ) : (
              <Link
                key={p}
                to={to(p)}
                onClick={toTop}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={pageLinkClass}
              >
                {p}
              </Link>
            ),
          )}
        </div>
        {step(page + 1, "Next page", <ChevronRightIcon className="size-4" />)}
      </div>
    </nav>
  );
}
