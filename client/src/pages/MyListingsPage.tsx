import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useMarket } from "@/components/market/MarketData";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button, Spinner } from "@/components/ui";
import { ApiError, deleteProduct, getMyProducts, type Product } from "@/lib/api";
import { formatPrice, primaryImage, stockLabel } from "@/lib/format";

type State = { status: "loading" | "ready" | "error"; products: Product[]; error: string | null };

const statusStyle: Record<string, { label: string; className: string }> = {
  Approved: { label: "Live", className: "border-accent/30 text-accent" },
  Pending: { label: "Waiting for approval", className: "border-line-strong text-muted" },
  Rejected: { label: "Rejected", className: "border-danger/30 text-danger" },
};

export function MyListingsPage() {
  const market = useMarket();
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [state, setState] = useState<State>({ status: "loading", products: [], error: null });

  const load = useCallback(async () => {
    try {
      const products = await getMyProducts();
      setState({ status: "ready", products: products.sort((a, b) => b.id - a.id), error: null });
    } catch (err) {
      setState({ status: "error", products: [], error: err instanceof ApiError ? err.message : "Something went wrong." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(product: Product) {
    await deleteProduct(product.id);
    setState(current => ({ ...current, products: current.products.filter(p => p.id !== product.id) }));
    market.reload();
  }

  return (
    <>
      <title>My listings - Satin Road</title>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">My listings</h1>
          {state.status === "ready" && state.products.length > 0 && (
            <p className="mt-1.5 text-[15px] text-muted">{summarize(state.products)}</p>
          )}
        </div>
        <Button render={<Link to="/market/listings/new" />} nativeButton={false}>
          New listing
        </Button>
      </div>

      {flash && (
        <p role="status" className="mb-6 rounded-lg border border-accent/25 bg-accent/5 px-4 py-3 text-[15px] text-accent">
          {flash}
        </p>
      )}

      {state.status === "loading" ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-lg bg-surface" />
          ))}
        </div>
      ) : state.status === "error" ? (
        <div className="rounded-lg border border-line px-6 py-16 text-center">
          <p className="text-lg font-medium tracking-tight">Your listings couldn't be loaded.</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{state.error}</p>
          <Button className="mt-6" onClick={load}>
            Try again
          </Button>
        </div>
      ) : state.products.length === 0 ? (
        <div className="rounded-lg border border-line px-6 py-16 text-center">
          <p className="text-lg font-medium tracking-tight">You haven't listed anything yet.</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
            Add a title, price, stock and a few photos. Buyers see it once an admin approves it.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {state.products.map(product => (
            <ListingRow key={product.id} product={product} categoryName={market.categoryName(product.categoryId)} onDelete={remove} />
          ))}
        </ul>
      )}
    </>
  );
}

function summarize(products: Product[]): string {
  const live = products.filter(p => p.status === "Approved").length;
  const pending = products.filter(p => p.status === "Pending").length;
  const rejected = products.filter(p => p.status === "Rejected").length;
  const soldOut = products.filter(p => p.status === "Approved" && p.stock <= 0).length;
  return [
    `${live} live`,
    pending > 0 ? `${pending} waiting for approval` : null,
    rejected > 0 ? `${rejected} rejected` : null,
    soldOut > 0 ? `${soldOut} sold out` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function ListingRow({
  product,
  categoryName,
  onDelete,
}: {
  product: Product;
  categoryName?: string;
  onDelete: (product: Product) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = statusStyle[product.status] ?? { label: product.status, className: "border-line-strong text-muted" };

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(product);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_8rem_auto] sm:items-center">
      <div className="relative row-span-2 sm:row-span-1">
        <ProductPhoto imageId={primaryImage(product)?.id} alt={product.title} className="aspect-square rounded-md" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            to={`/market/listings/${product.id}`}
            className="truncate text-[15px] text-fg underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            {product.title}
          </Link>
          <span className={`shrink-0 rounded border px-1.5 py-px text-[11px] ${status.className}`}>{status.label}</span>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {categoryName ?? "Uncategorized"}, {formatPrice(product.price)}
        </p>
        {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
      </div>

      <p className={`col-start-2 text-[15px] sm:col-start-3 sm:row-start-1 ${product.stock > 0 ? "text-muted" : "text-danger"}`}>
        {stockLabel(product.stock)}
      </p>

      <div className="col-start-2 flex items-center gap-4 text-[13px] sm:col-start-4 sm:row-start-1 sm:justify-end">
        {confirming ? (
          <>
            <span className="text-muted">Delete this listing?</span>
            <button type="button" onClick={confirmDelete} disabled={deleting} className={dangerActionClass}>
              {deleting ? <Spinner /> : "Delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className={actionClass}>
              Keep
            </button>
          </>
        ) : (
          <>
            <Link to={`/market/listings/${product.id}`} className={actionClass}>
              Edit
            </Link>
            <button type="button" onClick={() => setConfirming(true)} className={actionClass}>
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}

const actionBase = "rounded underline-offset-4 outline-none transition-colors focus-visible:underline";
const actionClass = `${actionBase} text-muted hover:text-fg focus-visible:text-fg`;
const dangerActionClass = `${actionBase} text-danger hover:underline`;
