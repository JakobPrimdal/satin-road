import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ChevronRightIcon } from "@/components/icons";
import { useMarket } from "@/components/market/MarketData";
import { ProductCard } from "@/components/market/ProductCard";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { QuantityField } from "@/components/market/QuantityField";
import { VendorMark } from "@/components/market/VendorMark";
import { SubmitButton, threadClass, type Notice } from "@/components/ui";
import { getProduct, type Product } from "@/lib/api";
import { formatPrice, plural, shortId, sortProducts, stockLabel } from "@/lib/format";
import { useCart } from "@/lib/local";
import { useSession } from "@/lib/session";

type Lookup = { status: "idle" | "loading" | "missing"; product: Product | null };

export function ProductPage() {
  const { productId } = useParams();
  const id = Number(productId);
  const market = useMarket();
  const fromList = market.products.find(p => p.id === id) ?? null;
  const [lookup, setLookup] = useState<Lookup>({ status: "idle", product: null });

  useEffect(() => {
    if (fromList || market.status !== "ready") return;
    if (!Number.isInteger(id) || id <= 0) {
      setLookup({ status: "missing", product: null });
      return;
    }
    let active = true;
    setLookup({ status: "loading", product: null });
    getProduct(id)
      .then(product => active && setLookup({ status: "idle", product }))
      .catch(() => active && setLookup({ status: "missing", product: null }));
    return () => {
      active = false;
    };
  }, [id, fromList, market.status]);

  const product = fromList ?? lookup.product;

  if (market.status === "error" && !product) {
    return <Unavailable title="This listing couldn't be loaded." body={market.error ?? "Something went wrong."} />;
  }
  if (lookup.status === "missing") {
    return <Unavailable title="This listing isn't available." body="It may have sold out, been removed, or still be waiting for approval." />;
  }
  if (!product) return <ProductSkeleton />;

  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const { categoryName, products } = useMarket();
  const category = categoryName(product.categoryId);
  const fromVendor = products.filter(p => p.vendorId === product.vendorId);
  const otherFromVendor = fromVendor.filter(p => p.id !== product.id);
  const sameCategory = products.filter(p => p.categoryId === product.categoryId && p.id !== product.id);
  const showVendor = otherFromVendor.length >= 2;
  const related = sortProducts(showVendor ? otherFromVendor : sameCategory, "newest").slice(0, 4);
  const stockClass = product.stock <= 0 ? "text-danger" : product.stock <= 3 ? "text-accent" : "text-muted";

  return (
    <article>
      <title>{`${product.title} - Satin Road`}</title>
      <Breadcrumbs categoryId={product.categoryId} categoryName={category} current={product.title} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <Gallery product={product} />

        <div className="flex flex-col">
          <h1 className="text-[2rem] leading-tight font-medium tracking-tight text-balance">{product.title}</h1>
          <p className="mt-3 text-2xl tracking-tight">{formatPrice(product.price)}</p>
          <p className={`mt-1 text-[15px] ${stockClass}`}>{stockLabel(product.stock)}</p>

          <div className="mt-8">
            <Purchase product={product} />
          </div>

          <div className="mt-10 border-t border-line pt-8">
            <h2 className="sr-only">Description</h2>
            {product.description ? (
              <p className="max-w-prose text-[15px] leading-relaxed whitespace-pre-line text-fg/85">{product.description}</p>
            ) : (
              <p className="text-[15px] text-faint">The vendor didn't add a description.</p>
            )}
          </div>

          <VendorCard vendorId={product.vendorId} listingCount={fromVendor.length} />
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="related-heading" className="text-[1.75rem] leading-tight font-medium tracking-tight">
              {showVendor ? "More from this vendor" : `More in ${category ?? "this category"}`}
            </h2>
            <Link
              to={showVendor ? `/market?vendor=${product.vendorId}` : `/market?category=${product.categoryId}`}
              className="text-[15px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {related.map(item => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function VendorCard({ vendorId, listingCount }: { vendorId: string; listingCount: number }) {
  return (
    <Link
      to={`/market?vendor=${vendorId}`}
      className="group/vendor relative mt-8 flex items-center gap-4 rounded-lg border border-line bg-surface p-4 outline-none transition-colors hover:border-line-strong focus-visible:border-accent/60"
    >
      <VendorMark vendorId={vendorId} className="size-11" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-muted">Sold by</span>
        <span className="block text-[15px] text-fg">
          Vendor <span className="font-mono">{shortId(vendorId)}</span>
        </span>
      </span>
      <span className="shrink-0 text-[13px] text-muted transition-colors group-hover/vendor:text-fg">
        {listingCount > 0 ? plural(listingCount, "listing") : "No other listings"}
      </span>
      <span
        aria-hidden="true"
        className={`${threadClass} border-accent [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-300 ease-out group-hover/vendor:[clip-path:inset(0)] group-focus-visible/vendor:[clip-path:inset(0)]`}
      />
    </Link>
  );
}

function Breadcrumbs({ categoryId, categoryName, current }: { categoryId: number; categoryName?: string; current?: string }) {
  const crumb = "rounded text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg focus-visible:underline focus-visible:underline-offset-4";

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <li>
          <Link to="/market" className={crumb}>
            Market
          </Link>
        </li>
        {categoryName && (
          <li className="flex items-center gap-1.5">
            <ChevronRightIcon className="size-3.5 text-faint" />
            <Link to={`/market?category=${categoryId}`} className={crumb}>
              {categoryName}
            </Link>
          </li>
        )}
        {current && (
          <li className="flex min-w-0 items-center gap-1.5">
            <ChevronRightIcon className="size-3.5 shrink-0 text-faint" />
            <span aria-current="page" className="truncate text-faint">
              {current}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}

function Gallery({ product }: { product: Product }) {
  const [selected, setSelected] = useState(0);
  const images = product.images;
  const current = images[Math.min(selected, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <ProductPhoto
          imageId={current?.id}
          alt={images.length > 1 ? `${product.title}, photo ${selected + 1} of ${images.length}` : product.title}
          eager
          className="aspect-[4/3] rounded-lg"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5" />
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show photo ${index + 1} of ${images.length}`}
              aria-pressed={index === selected}
              className="group/thumb relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <ProductPhoto
                imageId={image.id}
                alt=""
                eager
                className={`size-16 rounded-md transition-opacity sm:size-20 ${index === selected ? "" : "opacity-55 group-hover/thumb:opacity-90"}`}
              />
              <span
                aria-hidden="true"
                className={`${threadClass} rounded-md border-accent transition-[clip-path] duration-300 ease-out ${index === selected ? "[clip-path:inset(0)]" : "[clip-path:inset(0_100%_0_0)]"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Purchase({ product }: { product: Product }) {
  const session = useSession();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  if (product.vendorId === session?.user.userId) {
    return (
      <p className="rounded-lg border border-line px-4 py-3 text-[15px] text-muted">
        {product.status === "Approved" ? "This is your listing." : "This is your listing. It's waiting for approval."}
      </p>
    );
  }
  if (product.stock <= 0) {
    return <p className="rounded-lg border border-line px-4 py-3 text-[15px] text-muted">This listing is sold out.</p>;
  }

  const inCart = cart.quantityOf(product.id);
  const available = product.stock - inCart;
  const amount = Math.min(Math.max(quantity, 1), Math.max(available, 1));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (available <= 0) return;
    cart.add(product.id, amount);
    setQuantity(1);
    setNotice({ tone: "success", text: amount === 1 ? "Added to cart" : `Added ${amount} to cart` });
    setShowNotice(true);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {available > 0 ? (
        <div className="flex items-end justify-between gap-6">
          <QuantityField
            value={amount}
            onChange={value => {
              setQuantity(value);
              setShowNotice(false);
            }}
            max={available}
            label="Quantity"
          />
          <div className="text-right">
            <p className="text-[13px] text-muted">Total</p>
            <p className="mt-1.5 text-xl tracking-tight">{formatPrice(product.price * amount)}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-line px-4 py-3 text-[15px] text-muted">
          Every unit in stock is already in your cart.
        </p>
      )}

      {available > 0 && (
        <SubmitButton
          label="Add to cart"
          busy={false}
          notice={notice}
          showNotice={showNotice}
          onNoticeDone={() => setShowNotice(false)}
        />
      )}

      {inCart > 0 && (
        <p className="flex items-baseline justify-between gap-4 text-[15px] text-muted">
          <span>{inCart} in your cart</span>
          <Link to="/market/cart" className="text-accent underline-offset-4 outline-none hover:underline focus-visible:underline">
            Go to cart
          </Link>
        </p>
      )}
    </form>
  );
}

function Unavailable({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <title>Listing unavailable - Satin Road</title>
      <Breadcrumbs categoryId={0} />
      <div className="mt-6 rounded-lg border border-line px-6 py-16 text-center">
        <p className="text-lg font-medium tracking-tight">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{body}</p>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-4 w-40 rounded bg-surface" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="aspect-[4/3] rounded-lg bg-surface" />
        <div className="flex flex-col gap-4">
          <div className="h-9 w-3/4 rounded bg-surface" />
          <div className="h-7 w-1/4 rounded bg-surface" />
          <div className="mt-6 h-11 rounded-lg bg-surface" />
        </div>
      </div>
    </div>
  );
}
