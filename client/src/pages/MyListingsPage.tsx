import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useMarket } from "@/components/market/MarketData";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button, Spinner } from "@/components/ui";
import { ApiError, deleteProduct, getMyProducts,  setProductActive, updateStock, type Product } from "@/lib/api";
import { formatPrice, primaryImage,  } from "@/lib/format";

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

  function replace(updated: Product) {
    setState(current => ({ ...current, products: current.products.map(p => (p.id === updated.id ? updated : p)) }));
  }

  async function removeFromListings(product: Product) {
    await deleteProduct(product.id);
    setState(current => ({ ...current, products: current.products.filter(p => p.id !== product.id) }));
    market.reload();
  }

  async function deactivate(product: Product) {
    replace(await setProductActive(product.id, false));
    market.reload();
  }

  async function reactivate(product: Product) {
    replace(await setProductActive(product.id, true));
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
            <ListingRow key={product.id} product={product} categoryName={market.categoryName(product.categoryId)}  onRemove={removeFromListings}
                        onDeactivate={deactivate}
                        onReactivate={reactivate}
                        onChange={replace} />
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
                      onRemove,
                      onDeactivate,
                      onReactivate,
                      onChange,
                    }: {
  product: Product;
  categoryName?: string;
  onRemove: (product: Product) => Promise<void>;
  onDeactivate: (product: Product) => Promise<void>;
  onReactivate: (product: Product) => Promise<void>;
  onChange: (product: Product) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = !product.isActive && product.status !== "Rejected"
      ? { label: "Inactive", className: "border-line-strong text-faint" }
      : statusStyle[product.status] ?? { label: product.status, className: "border-line-strong text-muted" };

  // Runs deactivate/reactivate and shows an error under the row if it fails
  async function run(action: (product: Product) => Promise<void>) {
    setError(null);
    try {
      await action(product);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    setError(null);
    try {
      await onRemove(product); // row disappears from the list on success
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setRemoving(false);
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

      <div className="col-start-2 sm:col-start-3 sm:row-start-1">
        {product.status !== "Rejected" && <StockEditor product={product} onSaved={onChange} />}
      </div>

      <div className="col-start-2 flex items-center gap-4 text-[13px] sm:col-start-4 sm:row-start-1 sm:justify-end">
        {confirming ? (
          <>
            <span className="text-muted">Delete this listing?</span>
            <button type="button" onClick={confirmRemove} disabled={removing} className={dangerActionClass}>
              {removing ? <Spinner /> : "Delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={removing} className={actionClass}>
              Cancel
            </button>
          </>
        ) : (
            <>
              {product.status !== "Rejected" && (
                  <>
                    <Link to={`/market/listings/${product.id}`} className={actionClass}>
                      Edit
                    </Link>
                    {product.isActive ? (
                        <button type="button" onClick={() => run(onDeactivate)} className={actionClass}>
                          Deactivate
                        </button>
                    ) : (
                        <button type="button" onClick={() => run(onReactivate)} className={actionClass}>
                          Reactivate
                        </button>
                    )}
                  </>
              )}
              <button type="button" onClick={() => setConfirming(true)} className={dangerActionClass}>
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

function StockEditor({ product, onSaved }: { product: Product; onSaved: (product: Product) => void }) {
  const [value, setValue] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = value !== String(product.stock);

  async function save() {
    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Must be 0 or more.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onSaved(await updateStock(product.id, stock));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`stock-${product.id}`}>Stock</label>
        <input
            id={`stock-${product.id}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && changed && save()}
            className="h-8 w-16 rounded-md border border-line bg-field px-2 text-sm text-fg outline-none focus:border-accent/60"
        />
        {changed && (
            <button type="button" onClick={save} disabled={saving} className={actionClass}>
              {saving ? <Spinner /> : "Save"}
            </button>
        )}
        {error && <span className="text-[12px] text-danger">{error}</span>}
      </div>
  );
}