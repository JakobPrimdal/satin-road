import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAdmin } from "@/components/admin/AdminData";
import { ActionButton, EmptyState, LoadingRows, PageHeader, Person, StatusPill } from "@/components/admin/parts";
import { useApproval } from "@/components/admin/useApproval";
import { SearchIcon } from "@/components/icons";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button } from "@/components/ui";
import { ApiError, deleteProduct, setProductActive, type Product } from "@/lib/api";
import { formatPrice, plural, primaryImage, stockLabel, stockTone } from "@/lib/format";

const filters = [
  { value: "all", label: "All", test: () => true },
  { value: "live", label: "Live", test: (p: Product) => p.status === "Approved" && p.isActive },
  { value: "waiting", label: "Waiting", test: (p: Product) => p.status === "Pending" && p.isActive },
  { value: "rejected", label: "Rejected", test: (p: Product) => p.status === "Rejected" },
  { value: "inactive", label: "Inactive", test: (p: Product) => !p.isActive },
] as const;

export function AdminListings() {
  const admin = useAdmin();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const filter = filters.find(f => f.value === params.get("status")) ?? filters[0];

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
  const matches = admin.listings.filter(
    p => !term || p.title.toLowerCase().includes(term) || p.vendorUsername.toLowerCase().includes(term) || p.vendorId.startsWith(term),
  );
  const visible = matches.filter(filter.test);

  return (
    <>
      <title>Listings - Admin - Satin Road</title>
      <PageHeader title="Listings" description={plural(admin.listings.length, "listing")} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filter by status" className="flex rounded-lg border border-line bg-surface p-1">
          {filters.map(option => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter.value === option.value}
              onClick={() => setParams(option.value === "all" ? {} : { status: option.value }, { replace: true })}
              className="flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 aria-pressed:bg-raised aria-pressed:text-fg"
            >
              {option.label}
              <span className="text-[12px] text-faint">{matches.filter(option.test).length}</span>
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
  const admin = useAdmin();
  const approval = useApproval();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState<"delete" | "reactivate" | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const busy = approval.busy[product.id];
  const error = rowError ?? approval.errors[product.id];
  const live = product.status === "Approved" && product.isActive;

  async function remove() {
    setWorking("delete");
    setRowError(null);
    try {
      await deleteProduct(product.id);
      admin.patchListing(product.id, { isActive: false });
    } catch (err) {
      setRowError(err instanceof ApiError && err.status === 404 ? "This listing is already deleted." : errorText(err));
    } finally {
      setWorking(null);
      setConfirming(false);
    }
  }

  async function reactivate() {
    setWorking("reactivate");
    setRowError(null);
    try {
      await setProductActive(product.id, true);
      admin.patchListing(product.id, { isActive: true });
    } catch (err) {
      setRowError(err instanceof ApiError && err.status === 404 ? "This listing was deleted, so it can't be reactivated." : errorText(err));
    } finally {
      setWorking(null);
    }
  }

  return (
    <li className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-4 md:grid-cols-[3.5rem_minmax(0,1fr)_9rem_auto]">
      <ProductPhoto imageId={primaryImage(product)?.id} alt="" className="row-span-2 size-14 rounded-md md:row-span-1" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {live ? (
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
          {!product.isActive && (
            <span title="Paused or deleted by its vendor" className="shrink-0 rounded border border-line-strong px-1.5 py-px text-[11px] text-faint">
              Inactive
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[13px] text-muted">
            {admin.categoryName(product.categoryId) ?? "Uncategorized"}, {formatPrice(product.price)}
          </span>
          <Person id={product.vendorId} name={product.vendorUsername} role="Vendor" />
          {orderCount > 0 && <span className="text-[13px] text-faint">{plural(orderCount, "order")}</span>}
        </div>
        {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
      </div>

      <p className={`col-start-2 text-[13px] md:col-start-3 md:row-start-1 ${stockTone(product.stock)}`}>{stockLabel(product.stock)}</p>

      <div className="col-start-2 flex flex-wrap items-center gap-1 md:col-start-4 md:row-start-1 md:justify-end">
        {confirming ? (
          <>
            <span className="mr-1 text-[13px] text-muted">Delete this listing?</span>
            <ActionButton tone="danger" busy={working === "delete"} onClick={remove}>
              Delete
            </ActionButton>
            <ActionButton disabled={working === "delete"} onClick={() => setConfirming(false)}>
              Keep
            </ActionButton>
          </>
        ) : (
          <>
            {!product.isActive ? (
              <ActionButton busy={working === "reactivate"} onClick={reactivate}>
                Reactivate
              </ActionButton>
            ) : product.status === "Approved" ? (
              <ActionButton busy={busy === "Rejected"} disabled={!!busy} onClick={() => approval.setStatus(product, "Rejected")}>
                Take down
              </ActionButton>
            ) : (
              <ActionButton tone="primary" busy={busy === "Approved"} disabled={!!busy} onClick={() => approval.setStatus(product, "Approved")}>
                Approve
              </ActionButton>
            )}
            <ActionButton tone="danger" onClick={() => setConfirming(true)}>
              Delete
            </ActionButton>
          </>
        )}
      </div>
    </li>
  );
}

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong.";
}
