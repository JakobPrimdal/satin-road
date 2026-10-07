import { useState } from "react";
import { Link } from "react-router";
import { useAdmin } from "@/components/admin/AdminData";
import { EmptyState, LoadingRows, PageHeader, Person } from "@/components/admin/parts";
import { SearchIcon } from "@/components/icons";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button } from "@/components/ui";
import type { Order } from "@/lib/api";
import { plural, primaryImage } from "@/lib/format";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

function matches(order: Order, term: string) {
  if (!term) return true;
  const id = term.replace(/^#/, "");
  return (
    String(order.id) === id ||
    order.customerId.replace(/-/g, "").startsWith(term) ||
    order.customerUsername.toLowerCase().includes(term) ||
    order.items.some(
      item =>
        item.vendorId.replace(/-/g, "").startsWith(term) ||
        item.vendorUsername.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term),
    )
  );
}

export function AdminOrders() {
  const admin = useAdmin();
  const [query, setQuery] = useState("");

  if (admin.status === "loading") return <LoadingRows count={4} height="h-32" />;
  if (admin.status === "error") {
    return (
      <EmptyState title="Orders couldn't be loaded." body={admin.error ?? undefined}>
        <Button className="mt-6" onClick={admin.reload}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  const listings = new Map(admin.listings.map(p => [p.id, p]));
  const term = query.trim().toLowerCase();
  const visible = admin.orders.filter(order => matches(order, term));
  const units = admin.orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);

  return (
    <>
      <title>Orders - Admin - Satin Road</title>
      <PageHeader title="Orders" description={`${plural(admin.orders.length, "order")}, ${plural(units, "item")} sold`}>
        <label className="relative flex w-full items-center sm:w-80">
          <span className="sr-only">Search orders</span>
          <SearchIcon className="pointer-events-none absolute left-3 size-4 text-faint" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Order number, username or item"
            className="h-10 w-full rounded-lg border border-line bg-field pr-3 pl-9 text-sm text-fg caret-accent outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/10 any-pointer-coarse:text-base"
          />
        </label>
      </PageHeader>

      {admin.orders.length === 0 ? (
        <EmptyState title="No orders yet." body="Orders show up here as soon as buyers check out." />
      ) : visible.length === 0 ? (
        <EmptyState title="No orders match." body="Search by order number, a buyer or vendor username, or an item title." />
      ) : (
        <ol className="flex flex-col gap-4">
          {visible.map(order => (
            <li key={order.id} className="rounded-lg border border-line">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <h2 className="text-[15px] font-medium">Order #{order.id}</h2>
                  <Person id={order.customerId} name={order.customerUsername} role="Buyer" />
                </div>
                <time className="text-[13px] text-muted" dateTime={order.purchasedAt.toISOString()}>
                  {dateFormat.format(order.purchasedAt)}
                </time>
              </div>
              <ul className="divide-y divide-line">
                {order.items.map(item => {
                  const product = listings.get(item.productId);
                  return (
                    <li key={`${order.id}-${item.productId}`} className="flex items-center gap-4 px-5 py-3 text-[15px]">
                      <ProductPhoto imageId={product ? primaryImage(product)?.id : undefined} alt="" className="size-12 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        {product?.status === "Approved" ? (
                          <Link
                            to={`/market/product/${item.productId}`}
                            className="text-fg underline-offset-4 outline-none hover:underline focus-visible:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span>{item.title}</span>
                        )}
                        <span className="mt-1 block">
                          <Person id={item.vendorId} name={item.vendorUsername} role="Vendor" />
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {item.discountPercent > 0 && (
                          <span className="rounded border border-accent/30 px-1.5 py-px text-[11px] text-accent">
                            {item.discountPercent}% off
                          </span>
                        )}
                        <span className="text-muted">× {item.quantity}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
