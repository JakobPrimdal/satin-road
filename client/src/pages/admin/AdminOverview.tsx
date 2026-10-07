import type { ReactNode } from "react";
import { Link } from "react-router";
import { useAdmin } from "@/components/admin/AdminData";
import { ActionButton, EmptyState, LoadingRows, PageHeader, Person } from "@/components/admin/parts";
import { useApproval } from "@/components/admin/useApproval";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button } from "@/components/ui";
import type { Order } from "@/lib/api";
import { formatPrice, plural, primaryImage } from "@/lib/format";

const FEATURED_THRESHOLD = 100;
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function vendorSales(orders: Order[]) {
  const sales = new Map<string, { orders: number; units: number }>();
  for (const order of orders) {
    const vendors = new Set(order.items.map(item => item.vendorId));
    for (const vendorId of vendors) {
      const entry = sales.get(vendorId) ?? { orders: 0, units: 0 };
      entry.orders += 1;
      entry.units += order.items.filter(item => item.vendorId === vendorId).reduce((sum, item) => sum + item.quantity, 0);
      sales.set(vendorId, entry);
    }
  }
  const names = new Map(orders.flatMap(order => order.items.map(item => [item.vendorId, item.vendorUsername] as const)));
  return [...sales.entries()]
    .map(([vendorId, s]) => ({ vendorId, vendorUsername: names.get(vendorId) ?? "", ...s }))
    .sort((a, b) => b.orders - a.orders || b.units - a.units);
}

export function AdminOverview() {
  const admin = useAdmin();

  if (admin.status === "loading") return <LoadingRows count={3} height="h-32" />;
  if (admin.status === "error") {
    return (
      <EmptyState title="The dashboard couldn't be loaded." body={admin.error ?? undefined}>
        <Button className="mt-6" onClick={admin.reload}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  const live = admin.listings.filter(p => p.status === "Approved" && p.isActive);
  const pending = admin.listings.filter(p => p.status === "Pending" && p.isActive);
  const units = admin.orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);
  const sales = vendorSales(admin.orders);
  const topVendors = sales.slice(0, 6);
  const soldOut = live.filter(p => p.stock <= 0).length;
  const buyers = new Set(admin.orders.map(order => order.customerId)).size;

  return (
    <>
      <title>Admin - Satin Road</title>
      <PageHeader title="Overview" />

      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Stat
          label="Live listings"
          value={live.length}
          note={soldOut > 0 ? `${soldOut} sold out` : "All in stock"}
          to="/admin/listings?status=live"
        />
        <Stat
          label="Waiting for approval"
          value={pending.length}
          note={pending.length > 0 ? "Review now" : "Nothing to review"}
          to="/admin/approvals"
          highlight={pending.length > 0}
        />
        <Stat label="Orders" value={admin.orders.length} note={`from ${plural(buyers, "buyer")}`} to="/admin/orders" />
        <Stat label="Items sold" value={units} note={`across ${plural(sales.length, "vendor")}`} to="/admin/orders" />
      </ul>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <Panel title="Waiting for approval" action={pending.length > 0 ? { to: "/admin/approvals", label: "Review all" } : undefined}>
          {pending.length === 0 ? (
            <p className="px-5 py-8 text-center text-[15px] text-muted">Nothing is waiting for approval.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pending.slice(0, 4).map(product => (
                <PendingRow key={product.id} productId={product.id} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top vendors" action={{ to: "/admin/orders", label: "All orders" }}>
          {topVendors.length === 0 ? (
            <p className="px-5 py-8 text-center text-[15px] text-muted">No orders yet.</p>
          ) : (
            <ol className="divide-y divide-line">
              {topVendors.map((vendor, index) => (
                <li key={vendor.vendorId} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-4 text-[13px] text-faint">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Person id={vendor.vendorId} name={vendor.vendorUsername} role="Vendor" />
                  </div>
                  {vendor.orders > FEATURED_THRESHOLD && (
                    <span className="rounded border border-accent/30 px-1.5 py-px text-[11px] text-accent">Over {FEATURED_THRESHOLD} orders</span>
                  )}
                  <span className="text-right text-[13px] text-muted">
                    {plural(vendor.orders, "order")}, {plural(vendor.units, "item")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-12">
        <Panel title="Recent orders" action={{ to: "/admin/orders", label: "All orders" }}>
          {admin.orders.length === 0 ? (
            <p className="px-5 py-8 text-center text-[15px] text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {admin.orders.slice(0, 5).map(order => (
                <li key={order.id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-5 py-3 text-[15px] sm:grid-cols-[7rem_1fr_6rem_10rem]">
                  <span>Order #{order.id}</span>
                  <span className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
                    <Person id={order.customerId} name={order.customerUsername} role="Buyer" />
                  </span>
                  <span className="text-right text-[13px] text-muted sm:text-left">
                    {plural(order.items.reduce((s, i) => s + i.quantity, 0), "item")}
                  </span>
                  <time className="text-right text-[13px] text-muted" dateTime={order.purchasedAt.toISOString()}>
                    {dateFormat.format(order.purchasedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, note, to, highlight = false }: { label: string; value: number; note: string; to: string; highlight?: boolean }) {
  return (
    <li className="grain">
      <Link to={to} className="block h-full p-5 outline-none transition-colors hover:bg-surface focus-visible:bg-surface">
        <span className="block text-[13px] text-muted">{label}</span>
        <span className={`mt-2 block text-[1.75rem] leading-none tracking-tight ${highlight ? "text-accent" : "text-fg"}`}>{value}</span>
        <span className={`mt-2 block text-[13px] ${highlight ? "text-accent/80" : "text-faint"}`}>{note}</span>
      </Link>
    </li>
  );
}

function Panel({ title, action, children }: { title: string; action?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line">
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-medium">{title}</h2>
        {action && (
          <Link to={action.to} className="rounded text-[13px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function PendingRow({ productId }: { productId: number }) {
  const admin = useAdmin();
  const approval = useApproval();
  const product = admin.listings.find(p => p.id === productId);
  if (!product) return null;
  const busy = approval.busy[product.id];

  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <ProductPhoto imageId={primaryImage(product)?.id} alt="" className="size-12 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]">{product.title}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {admin.categoryName(product.categoryId) ?? "Uncategorized"}, {formatPrice(product.price)}
        </p>
        {approval.errors[product.id] && <p className="mt-0.5 text-[13px] text-danger">{approval.errors[product.id]}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <ActionButton tone="danger" busy={busy === "Rejected"} disabled={!!busy} onClick={() => approval.setStatus(product, "Rejected")}>
          Reject
        </ActionButton>
        <ActionButton tone="primary" busy={busy === "Approved"} disabled={!!busy} onClick={() => approval.setStatus(product, "Approved")}>
          Approve
        </ActionButton>
      </div>
    </li>
  );
}
