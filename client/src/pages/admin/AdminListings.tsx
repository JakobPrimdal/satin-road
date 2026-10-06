import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAdmin } from "@/components/admin/AdminData";
import { ActionButton, EmptyState, LoadingRows, PageHeader, Person, StatusPill } from "@/components/admin/parts";
import { useApproval } from "@/components/admin/useApproval";
import { SearchIcon } from "@/components/icons";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button } from "@/components/ui";
import { ApiError, deleteProduct, type Product } from "@/lib/api";
import { formatPrice, plural, primaryImage, stockLabel, stockTone } from "@/lib/format";

const filters = [
  { value: "all", label: "All" },
  { value: "Approved", label: "Live" },
  { value: "Pending", label: "Waiting" },
  { value: "Rejected", label: "Rejected" },
] as const;

export function AdminListings() {
  const admin = useAdmin();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const status = filters.some(f => f.value === params.get("status")) ? params.get("status")! : "all";

  if (admin.status === "loading") return <LoadingRows count={5} />;
  if (admin.status === "error") {
    return (
      <EmptyState title="Listings couldn't be loaded." body={admin.error ?? undefined}>
        <Button className="mt-6" onClick={admin.reload}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  const orderCounts = new Map<number, number>();
  admin.orders.forEach(order => new Set(order.items.map(item => item.productId)).forEach(id => orderCounts.set(id, (orderCounts.get(id) ?? 0) + 1)));
  const term = query.trim().toLowerCase();
  const matches = admin.listings.filter(p => !term || p.title.toLowerCase().includes(term) || p.vendorId.startsWith(term));
  const visible = status === "all" ? matches : matches.filter(p => p.status === status);
  const countFor = (value: string) => (value === "all" ? matches.length : matches.filter(p => p.status === value).length);

  return (
    <>
      <title>Listings - Admin - Satin Road</title>
      <PageHeader title="Listings" description={plural(admin.listings.length, "listing")} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filter by status" className="flex rounded-lg border border-line bg-surface p-1">
          {filters.map(filter => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => setParams(filter.value === "all" ? {} : { status: filter.value }, { replace: true })}
              className="flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 aria-pressed:bg-raised aria-pressed:text-fg"
            >
              {filter.label}
              <span className="text-[12px] text-faint">{countFor(filter.value)}</span>
            </button>
          ))}
        </div>
        <label className="relative flex w-full items-center sm:w-72">
          <span className="sr-only">Search listings</span>
          <SearchIcon className="pointer-events-none absolute left-3 size-4 text-faint" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by title or vendor"
            className="h-10 w-full rounded-lg border border-line bg-field pr-3 pl-9 text-sm text-fg caret-accent outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/10 any-pointer-coarse:text-base"
          />
        </label>
      </div>

      <p className="mb-6 text-[13px] text-faint">
        Rejected listings only show here when you rejected them during this visit, or when they're your own.
      </p>

      {visible.length === 0 ? (
        <EmptyState title="No listings match." body="Try another status or search." />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map(product => (
            <ListingRow key={product.id} product={product} orderCount={orderCounts.get(product.id) ?? 0} />
          ))}
        </ul>
      )}
    </>
  );
}

function ListingRow({ product, orderCount }: { product: Product; orderCount: number }) {
  const hasOrders = orderCount > 0;
  const admin = useAdmin();
  const approval = useApproval();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const busy = approval.busy[product.id];
  const error = deleteError ?? approval.errors[product.id];

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(product.id);
      admin.patchListing(product.id, { isActive: false })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <li className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-4 md:grid-cols-[3.5rem_minmax(0,1fr)_9rem_auto]">
      <ProductPhoto imageId={primaryImage(product)?.id} alt="" className="row-span-2 size-14 rounded-md md:row-span-1" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {product.status === "Approved" ? (
            <Link
              to={`/market/product/${product.id}`}
              className="truncate text-[15px] text-fg underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              {product.title}
            </Link>
          ) : (
            <span className="truncate text-[15px]">{product.title}</span>
          )}
          <StatusPill status={product.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[13px] text-muted">
            {admin.categoryName(product.categoryId) ?? "Uncategorized"}, {formatPrice(product.price)}
          </span>
          <Person id={product.vendorId} role="Vendor" />
          {hasOrders && <span className="text-[13px] text-faint">{plural(orderCount, "order")}</span>}
        </div>
        {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
      </div>

      <p className={`col-start-2 text-[13px] md:col-start-3 md:row-start-1 ${stockTone(product.stock)}`}>{stockLabel(product.stock)}</p>

      <div className="col-start-2 flex flex-wrap items-center gap-1 md:col-start-4 md:row-start-1 md:justify-end">
        {confirming ? (
          <>
            <span className="mr-1 text-[13px] text-muted">Delete for good?</span>
            <ActionButton tone="danger" busy={deleting} onClick={remove}>
              Delete
            </ActionButton>
            <ActionButton disabled={deleting} onClick={() => setConfirming(false)}>
              Keep
            </ActionButton>
          </>
        ) : (
          <>
            {product.status === "Approved" ? (
              <ActionButton busy={busy === "Rejected"} disabled={!!busy} onClick={() => approval.setStatus(product, "Rejected")}>
                Take down
              </ActionButton>
            ) : (
              <ActionButton tone="primary" busy={busy === "Approved"} disabled={!!busy} onClick={() => approval.setStatus(product, "Approved")}>
                Approve
              </ActionButton>
            )}
            <span title={hasOrders ? "This listing has orders, so it can't be deleted. Take it down instead." : undefined}>
              <ActionButton tone="danger" disabled={hasOrders} onClick={() => setConfirming(true)}>
                Delete
              </ActionButton>
            </span>
          </>
        )}
      </div>
    </li>
  );
}
