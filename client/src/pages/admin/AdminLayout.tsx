import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { AdminDataProvider, useAdmin } from "@/components/admin/AdminData";
import { RefreshIcon } from "@/components/icons";
import { Wordmark } from "@/components/Logo";
import { AccountMenu } from "@/components/market/Navbar";
import { ThreadRail } from "@/components/ThreadRail";
import { Spinner } from "@/components/ui";
import { isAdmin, useSession } from "@/lib/session";

const sections = [
  { key: "overview", to: "/admin", label: "Overview" },
  { key: "approvals", to: "/admin/approvals", label: "Approvals" },
  { key: "listings", to: "/admin/listings", label: "Listings" },
  { key: "categories", to: "/admin/categories", label: "Categories" },
  { key: "orders", to: "/admin/orders", label: "Orders" },
  { key: "users", to: "/admin/users", label: "Users" },
];

export function AdminLayout() {
  const session = useSession();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!session) return <Navigate to="/" replace />;
  if (!isAdmin(session)) return <Navigate to="/market" replace />;

  return (
    <AdminDataProvider>
      <div className="flex min-h-screen flex-col">
        <AdminHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-10 pb-24 sm:px-6">
          <Outlet />
        </main>
      </div>
    </AdminDataProvider>
  );
}

function AdminHeader() {
  const { listings, refreshing, reload, status, error } = useAdmin();
  const { pathname } = useLocation();
  const pending = listings.filter(p => p.status === "Pending" && p.isActive).length;

  const items = sections.map(section => ({
    ...section,
    active: section.to === "/admin" ? pathname === "/admin" : pathname.startsWith(section.to),
    badge: section.key === "approvals" ? pending : undefined,
  }));

  return (
    <header className="grain sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
            <Wordmark />
          </Link>
          <span className="rounded border border-accent/30 px-1.5 py-px text-[11px] text-accent">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "ready" && error && !refreshing && (
            <span className="hidden text-[13px] text-danger sm:inline">Couldn't refresh</span>
          )}
          <button
            type="button"
            onClick={reload}
            disabled={refreshing}
            aria-label="Refresh dashboard data"
            className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted outline-none transition-colors hover:bg-field hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-progress"
          >
            {refreshing ? <Spinner /> : <RefreshIcon className="size-4" />}
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/market"
            className="flex h-10 items-center rounded-lg px-3 text-sm text-muted outline-none transition-colors hover:bg-field hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            View market
          </Link>
          <AccountMenu />
        </div>
      </div>
      <ThreadRail label="Admin sections" items={items} />
    </header>
  );
}
