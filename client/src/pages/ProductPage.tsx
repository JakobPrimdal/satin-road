import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { NumberField } from "@base-ui/react/number-field";
import { ChevronLeftIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { useMarket } from "@/components/market/MarketData";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { SubmitButton, threadClass, type Notice } from "@/components/ui";
import { ApiError, getProduct, placeOrder, type Product } from "@/lib/api";
import { formatPrice, shortId, stockLabel } from "@/lib/format";
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

  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const { categoryName } = useMarket();
  const category = categoryName(product.categoryId);

  return (
    <article>
      <title>{`${product.title} - Satin Road`}</title>
      <BackLink categoryId={product.categoryId} categoryName={category} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <Gallery product={product} />

        <div className="flex flex-col">
          <h1 className="text-[2rem] leading-tight font-medium tracking-tight text-balance">{product.title}</h1>
          <p className="mt-3 text-2xl tracking-tight">{formatPrice(product.price)}</p>
          <p className={`mt-1 text-[15px] ${product.stock > 0 ? "text-muted" : "text-danger"}`}>{stockLabel(product.stock)}</p>

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
            <p className="mt-8 text-[13px] text-faint">
              Sold by vendor <span className="font-mono text-muted">{shortId(product.vendorId)}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function BackLink({ categoryId, categoryName }: { categoryId: number; categoryName?: string }) {
  return (
    <Link
      to={categoryName ? `/market?category=${categoryId}` : "/market"}
      className="inline-flex items-center gap-1 rounded text-[13px] text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg focus-visible:underline focus-visible:underline-offset-4"
    >
      <ChevronLeftIcon className="size-4" />
      {categoryName ?? "All listings"}
    </Link>
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
  const market = useMarket();
  const quantityId = useId();
  const [quantity, setQuantity] = useState(1);
  const [ordered, setOrdered] = useState(false);
  const [busy, setBusy] = useState(false);
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
    return (
      <p role="status" className="rounded-lg border border-line px-4 py-3 text-[15px] text-muted">
        {ordered ? "Order placed. You bought the last one in stock." : "This listing is sold out."}
      </p>
    );
  }

  const amount = Math.min(Math.max(quantity, 1), product.stock);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setShowNotice(false);
    setBusy(true);
    try {
      await placeOrder([{ productId: product.id, quantity: amount }]);
      setNotice({ tone: "success", text: "Order placed" });
      setShowNotice(true);
      setOrdered(true);
      setQuantity(1);
      await market.reload();
    } catch (err) {
      setNotice({ tone: "danger", text: err instanceof ApiError ? err.message : "Something went wrong." });
      setShowNotice(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-6">
        <NumberField.Root
          value={amount}
          onValueChange={value => {
            setQuantity(value ?? 1);
            setShowNotice(false);
          }}
          id={quantityId}
          min={1}
          max={product.stock}
          className="flex flex-col gap-1.5"
        >
          <label htmlFor={quantityId} className="text-[13px] text-muted">
            Quantity
          </label>
          <NumberField.Group className="flex h-11 w-36 items-stretch rounded-lg border border-line bg-field transition-[border-color,box-shadow] focus-within:border-accent/60 focus-within:ring-3 focus-within:ring-accent/10 hover:border-line-strong">
            <NumberField.Decrement className={stepperClass} aria-label="Decrease quantity">
              <MinusIcon className="size-4" />
            </NumberField.Decrement>
            <NumberField.Input className="w-full min-w-0 bg-transparent text-center text-[15px] text-fg caret-accent outline-none any-pointer-coarse:text-base" />
            <NumberField.Increment className={stepperClass} aria-label="Increase quantity">
              <PlusIcon className="size-4" />
            </NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>

        <div className="text-right">
          <p className="text-[13px] text-muted">Total</p>
          <p className="mt-1.5 text-xl tracking-tight">{formatPrice(product.price * amount)}</p>
        </div>
      </div>

      <SubmitButton
        label="Place order"
        busy={busy}
        notice={notice}
        showNotice={showNotice}
        onNoticeDone={() => setShowNotice(false)}
      />
    </form>
  );
}

const stepperClass =
  "grid w-11 shrink-0 place-items-center text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg data-disabled:text-line-strong";

function Unavailable({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <title>Listing unavailable - Satin Road</title>
      <BackLink categoryId={0} />
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
      <div className="h-4 w-24 rounded bg-surface" />
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
