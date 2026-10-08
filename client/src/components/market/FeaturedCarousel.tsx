import { useEffect, useState } from "react";
import { ProductCard } from "@/components/market/ProductCard";
import type { Product } from "@/lib/api";
import { threadClass } from "@/components/ui";
const PRODUCTS_PER_PAGE = 5;
const AUTO_ADVANCE_MS = 5000;
export function FeaturedCarousel({ products }: { products: Product[] }) {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const pageCount = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const visibleProducts = products.slice(
    currentPage * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE + PRODUCTS_PER_PAGE,
  );
  useEffect(() => {
    setPage(0);
    setProgressKey((key) => key + 1);
  }, [products]);
  if (products.length === 0) {
    return null;
  }
  function goToPage(nextPage: number) {
    if (pageCount <= 1) {
      return;
    }
    const normalized = (nextPage + pageCount) % pageCount;
    setPage(normalized);
    setProgressKey((key) => key + 1);
  }
  return (
    <section
      aria-labelledby="featured-heading"
      className="mb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {" "}
      <div className="mb-8 flex items-end justify-between gap-6">
        {" "}
        <div>
          {" "}
          <h2
            id="featured-heading"
            className="text-[1.75rem] leading-tight font-medium tracking-tight"
          >
            {" "}
            Featured{" "}
          </h2>{" "}
          {pageCount > 1 && (
            <p className="mt-1.5 text-[13px] text-muted">
              {" "}
              {currentPage + 1} / {pageCount}{" "}
            </p>
          )}{" "}
        </div>{" "}
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            {" "}
            <button
              type="button"
              aria-label="Previous featured products"
              onClick={() => goToPage(currentPage - 1)}
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted outline-none transition-colors hover:border-line-strong hover:text-fg focus-visible:border-accent/60"
            >
              {" "}
              <span aria-hidden="true">←</span>{" "}
            </button>{" "}
            <button
              type="button"
              aria-label="Next featured products"
              onClick={() => goToPage(currentPage + 1)}
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted outline-none transition-colors hover:border-line-strong hover:text-fg focus-visible:border-accent/60"
            >
              {" "}
              <span aria-hidden="true">→</span>{" "}
            </button>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div>
        {" "}
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {" "}
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}{" "}
        </div>{" "}
        {pageCount > 1 && (
          <div
            className={`${threadClass} mt-8 overflow-hidden border-line-strong`}
            aria-hidden="true"
          >
            {" "}
            <span
              key={progressKey}
              className={`${threadClass} border-accent ${paused ? "[animation-play-state:paused]" : "animate-drain"}`}
              style={{
                animationDuration: `${AUTO_ADVANCE_MS}ms`,
                animationIterationCount: 1,
                animationFillMode: "forwards",
              }}
              onAnimationEnd={() => {
                if (!paused) {
                  goToPage(currentPage + 1);
                }
              }}
            />{" "}
          </div>
        )}{" "}
      </div>{" "}
    </section>
  );
}
