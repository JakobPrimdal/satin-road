import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { useMarket } from "@/components/market/MarketData";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { QuantityField } from "@/components/market/QuantityField";
import { SubmitButton, type Notice } from "@/components/ui";
import { ApiError, placeOrder, type Product } from "@/lib/api";
import { formatPrice, plural, primaryImage } from "@/lib/format";
import { roundBtc, useCart, useWallet, type CartLine } from "@/lib/local";

interface ResolvedLine {
  line: CartLine;
  product: Product | undefined;
  quantity: number;
}

interface Placed {
  orderId: number;
  total: number;
  units: number;
}

export function CartPage() {
  const market = useMarket();
  const cart = useCart();
  const wallet = useWallet();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const resolved: ResolvedLine[] = cart.lines.map(line => {
    const product = market.products.find(p => p.id === line.productId);
    return { line, product, quantity: product ? Math.min(line.quantity, product.stock) : 0 };
  });
  const payable = resolved.filter(r => r.product && r.quantity > 0);
  const units = payable.reduce((sum, r) => sum + r.quantity, 0);
  const total = roundBtc(payable.reduce((sum, r) => sum + r.product!.price * r.quantity, 0));
  const remaining = roundBtc(wallet.balance - total);

  async function checkout(event: FormEvent) {
    event.preventDefault();
    setShowNotice(false);
    if (payable.length === 0) return;
    if (remaining < 0) {
      setNotice({ tone: "danger", text: "Not enough bitcoin in your wallet." });
      setShowNotice(true);
      return;
    }

    setBusy(true);
    try {
      const order = await placeOrder(payable.map(r => ({ productId: r.line.productId, quantity: r.quantity })));
      wallet.spend(total);
      cart.removeAll(payable.map(r => r.line.productId));
      setPlaced({ orderId: order.id, total, units });
      market.reload();
    } catch (err) {
      setNotice({ tone: "danger", text: err instanceof ApiError ? err.message : "Something went wrong." });
      setShowNotice(true);
      market.reload();
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <>
        <title>Order placed - Satin Road</title>
        <div className="mx-auto max-w-lg py-10 text-center">
          <p className="text-[13px] text-muted">Order #{placed.orderId}</p>
          <h1 className="mt-2 text-[1.75rem] leading-tight font-medium tracking-tight">Order placed</h1>
          <p className="mt-3 text-[15px] text-muted">
            You paid {formatPrice(placed.total)} for {plural(placed.units, "item")}. Your wallet now holds{" "}
            <span className="text-fg">{formatPrice(wallet.balance)}</span>.
          </p>
          <div className="mt-8 flex justify-center gap-6 text-[15px]">
            <Link to="/market/orders" className={linkClass}>
              View your orders
            </Link>
            <Link to="/market" className={linkClass}>
              Keep browsing
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Cart - Satin Road</title>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">Cart</h1>
          {cart.lines.length > 0 && <p className="mt-1.5 text-[15px] text-muted">{plural(cart.count, "item")}</p>}
        </div>
        {cart.lines.length > 0 && (
          <Link to="/market" className={linkClass}>
            Keep browsing
          </Link>
        )}
      </div>

      {cart.lines.length === 0 ? (
        <Empty title="Your cart is empty." body="Listings you add to your cart show up here.">
          <Link to="/market" className={`mt-6 inline-block ${linkClass}`}>
            Browse listings
          </Link>
        </Empty>
      ) : market.status === "loading" ? (
        <div className="h-48 rounded-lg bg-surface" aria-hidden="true" />
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ul className="divide-y divide-line border-y border-line">
            {resolved.map(item => (
              <CartRow key={item.line.productId} item={item} />
            ))}
          </ul>

          <form onSubmit={checkout} className="rounded-lg border border-line bg-surface p-5 lg:sticky lg:top-36">
            <h2 className="sr-only">Summary</h2>
            <dl className="flex flex-col gap-3 text-[15px]">
              <SummaryRow label={`Subtotal, ${plural(units, "item")}`} value={formatPrice(total)} />
              <SummaryRow label="Wallet balance" value={formatPrice(wallet.balance)} muted />
              <div className="border-t border-line pt-3">
                <SummaryRow
                  label="After paying"
                  value={formatPrice(Math.max(remaining, 0))}
                  tone={remaining < 0 ? "danger" : undefined}
                />
              </div>
            </dl>
            {remaining < 0 && <p className="mt-3 text-[13px] text-danger">Not enough bitcoin in your wallet for this order.</p>}
            {payable.length === 0 && <p className="mt-3 text-[13px] text-muted">Nothing in your cart can be bought right now.</p>}
            <SubmitButton
              label={payable.length > 0 ? `Pay ${formatPrice(total)}` : "Pay"}
              busy={busy}
              notice={notice}
              showNotice={showNotice}
              onNoticeDone={() => setShowNotice(false)}
              className="mt-5 w-full"
            />
            <p className="mt-3 text-center text-[13px] text-faint">Paid from your Satin Road wallet.</p>
          </form>
        </div>
      )}
    </>
  );
}

function CartRow({ item }: { item: ResolvedLine }) {
  const cart = useCart();
  const { line, product, quantity } = item;

  const remove = (
    <button
      type="button"
      onClick={() => cart.remove(line.productId)}
      className="rounded text-[13px] text-faint underline-offset-4 outline-none transition-colors hover:text-fg focus-visible:text-fg focus-visible:underline"
    >
      Remove
    </button>
  );

  if (!product || product.stock <= 0) {
    return (
      <li className="flex items-center justify-between gap-4 py-5">
        <p className="text-[15px] text-muted">
          {product ? `${product.title} is sold out.` : "This listing is no longer available."}
        </p>
        {remove}
      </li>
    );
  }

  const lowered = line.quantity > product.stock;

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto_7rem] sm:items-start">
      <Link to={`/market/product/${product.id}`} className="row-span-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:row-span-1">
        <ProductPhoto imageId={primaryImage(product)?.id} alt={product.title} className="aspect-square rounded-md" />
      </Link>
      <div className="min-w-0">
        <Link
          to={`/market/product/${product.id}`}
          className="line-clamp-2 text-[15px] text-fg underline-offset-4 outline-none hover:underline focus-visible:underline"
        >
          {product.title}
        </Link>
        <p className="mt-1 text-[13px] text-muted">{formatPrice(product.price)} each</p>
        {lowered && <p className="mt-1 text-[13px] text-danger">Only {product.stock} left, so your quantity was lowered.</p>}
        <div className="mt-2">{remove}</div>
      </div>
      <div className="col-start-2 flex items-center justify-between gap-4 sm:contents">
        <div className="sm:col-start-3 sm:row-start-1">
          <QuantityField
            value={quantity}
            onChange={value => cart.setQuantity(product.id, value)}
            max={product.stock}
            label={`Quantity of ${product.title}`}
            hideLabel
            compact
          />
        </div>
        <p className="text-right text-[15px] sm:col-start-4 sm:row-start-1 sm:pt-1.5">{formatPrice(product.price * quantity)}</p>
      </div>
    </li>
  );
}

function SummaryRow({ label, value, muted, tone }: { label: string; value: string; muted?: boolean; tone?: "danger" }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={tone === "danger" ? "text-danger" : muted ? "text-muted" : "text-fg"}>{value}</dd>
    </div>
  );
}

function Empty({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line px-6 py-16 text-center">
      <p className="text-lg font-medium tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{body}</p>
      {children}
    </div>
  );
}

const linkClass = "text-[15px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline";
