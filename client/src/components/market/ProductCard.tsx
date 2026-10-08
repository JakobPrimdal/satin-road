import { Link } from "react-router";
import { threadClass } from "@/components/ui";
import type { Product } from "@/lib/api";
import { formatPrice, primaryImage, stockLabel, stockTone } from "@/lib/format";
import { useCart } from "@/lib/local";
import { useMarket } from "./MarketData";
import { ProductPhoto } from "./ProductPhoto";
import {useSession} from "@/lib/session";

export function ProductCard({ product, lead = false }: { product: Product; lead?: boolean }) {
  const { categoryName } = useMarket();
  const cart = useCart();
  const inCart = cart.quantityOf(product.id);
  const image = primaryImage(product);
  const soldOut = product.stock <= 0;
  const session = useSession();

  return (
    <Link
      to={`/market/product/${product.id}`}
      className="group/card flex h-full flex-col gap-3 rounded-lg outline-none"
    >
      <div className={`relative ${lead ? "flex-1" : ""}`}>
        <ProductPhoto
          imageId={image?.id}
          alt={product.title}
          className={`rounded-lg ${lead ? "aspect-[4/3] h-full sm:aspect-[16/9] lg:aspect-auto lg:min-h-[22rem]" : "aspect-[4/3]"} ${soldOut ? "opacity-60" : ""}`}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5" />
        {inCart > 0 && (
          <span className="absolute top-2.5 left-2.5 rounded-md bg-canvas/85 px-2 py-1 text-[12px] text-accent">
            {inCart} in cart
          </span>
        )}
        <span
          aria-hidden="true"
          className={`${threadClass} border-accent [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-300 ease-out group-hover/card:[clip-path:inset(0)] group-focus-visible/card:[clip-path:inset(0)]`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3
            className={`min-w-0 leading-snug text-fg underline-offset-4 group-focus-visible/card:underline ${lead ? "text-xl font-medium tracking-tight" : "line-clamp-2 text-[15px]"}`}
          >
            {product.title}
          </h3>
          <span className={`shrink-0 ${lead ? "text-xl tracking-tight" : "text-[15px]"}`}>
            {formatPrice(product.price)}
          </span>
        </div>
        {lead && product.description && (
          <p className="line-clamp-2 max-w-prose text-[15px] leading-relaxed text-muted">{product.description}</p>
        )}
        <div className="flex items-baseline justify-between gap-4 text-[13px]">
          <span className="flex min-w-0 items-center gap-2">
  <span className="truncate text-muted">{categoryName(product.categoryId) ?? "Uncategorized"}</span>
            {product.vendorId === session?.user.userId && (
                <span className="shrink-0 rounded border border-accent/30 px-1.5 py-px text-[11px] text-accent">Your listing</span>
            )}
</span>
          <span className={`shrink-0 ${stockTone(product.stock)}`}>{stockLabel(product.stock)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="aspect-[4/3] rounded-lg bg-surface" />
      <div className="h-4 w-2/3 rounded bg-surface" />
      <div className="h-3 w-1/3 rounded bg-surface" />
    </div>
  );
}
