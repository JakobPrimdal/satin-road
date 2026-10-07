import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMarket } from "@/components/market/MarketData";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { VendorMark } from "@/components/market/VendorMark";
import { Button } from "@/components/ui";
import { ApiError, getOrders, type Order } from "@/lib/api";
import { plural, primaryImage, shortId } from "@/lib/format";

type State = { status: "loading" | "ready" | "error"; orders: Order[]; error: string | null };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function OrdersPage() {
  const market = useMarket();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: "loading", orders: [], error: null });

  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, status: "loading" }));
    getOrders()
      .then(orders => active && setState({ status: "ready", orders: orders.sort((a, b) => b.id - a.id), error: null }))
      .catch(err => active && setState({ status: "error", orders: [], error: err instanceof ApiError ? err.message : "Something went wrong." }));
    return () => {
      active = false;
    };
  }, [attempt]);

  const forSale = new Map(market.products.map(p => [p.id, p]));

  return (
    <>
      <title>Orders - Satin Road</title>
      <div className="mb-8">
        <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">Orders</h1>
        {state.status === "ready" && state.orders.length > 0 && (
          <p className="mt-1.5 text-[15px] text-muted">{plural(state.orders.length, "order")}</p>
        )}
      </div>

      {state.status === "loading" ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 rounded-lg bg-surface" />
          ))}
        </div>
      ) : state.status === "error" ? (
        <div className="rounded-lg border border-line px-6 py-16 text-center">
          <p className="text-lg font-medium tracking-tight">Your orders couldn't be loaded.</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{state.error}</p>
          <Button className="mt-6" onClick={() => setAttempt(n => n + 1)}>
            Try again
          </Button>
        </div>
      ) : state.orders.length === 0 ? (
        <div className="rounded-lg border border-line px-6 py-16 text-center">
          <p className="text-lg font-medium tracking-tight">You haven't ordered anything yet.</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">Orders you check out from your cart show up here.</p>
          <Link to="/market" className="mt-6 inline-block text-[15px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-4">
          {state.orders.map(order => (
            <li key={order.id} className="rounded-lg border border-line">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-5 py-3.5">
                <h2 className="text-[15px] font-medium">Order #{order.id}</h2>
                <p className="text-[13px] text-muted">
                  <time dateTime={order.purchasedAt.toISOString()}>{dateFormat.format(order.purchasedAt)}</time>
                </p>
              </div>
              <ul className="divide-y divide-line">
                {order.items.map(item => {
                  const product = forSale.get(item.productId);
                  return (
                    <li key={`${order.id}-${item.productId}`} className="flex items-center gap-4 px-5 py-3 text-[15px]">
                      <ProductPhoto
                        imageId={product ? primaryImage(product)?.id : undefined}
                        alt=""
                        className="size-12 shrink-0 rounded-md"
                      />
                      <span className="min-w-0 flex-1">
                        {product ? (
                          <Link
                            to={`/market/product/${item.productId}`}
                            className="text-fg underline-offset-4 outline-none hover:underline focus-visible:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="text-fg">{item.title}</span>
                        )}
                        <Link
                          to={`/market?vendor=${item.vendorId}`}
                          className="mt-1 flex w-fit items-center gap-1.5 rounded text-[13px] text-faint underline-offset-4 outline-none hover:text-muted hover:underline focus-visible:underline"
                        >
                          <VendorMark vendorId={item.vendorId} className="size-4 rounded-sm" />
                          {item.vendorUsername ? (
                            <>Sold by {item.vendorUsername}</>
                          ) : (
                            <>
                              Vendor <span className="font-mono">{shortId(item.vendorId)}</span>
                            </>
                          )}
                        </Link>
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
