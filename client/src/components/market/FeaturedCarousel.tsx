import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ProductCard } from "@/components/market/ProductCard";
import type { Product } from "@/lib/api";

const PRODUCTS_PER_PAGE = 5;
const AUTO_ADVANCE_MS = 5000;

export function FeaturedCarousel({
  products,
}: {
  products: Product[];
}) {
  const pages = useMemo(() => {
    const result = [];

    for (
      let i = 0;
      i < products.length;
      i += PRODUCTS_PER_PAGE
    ) {
      result.push(
        products.slice(
          i,
          i + PRODUCTS_PER_PAGE,
        ),
      );
    }

    return result;
  }, [products]);

  const pageCount = pages.length;

  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const currentProducts = pages[page] ?? [];

  const changePage = useCallback(
    (nextPage: number) => {
      if (pageCount <= 1) return;

      const normalized =
        (nextPage + pageCount) % pageCount;

      setPage(normalized);
      setProgressKey(value => value + 1);
    },
    [pageCount],
  );

  const nextPage = useCallback(() => {
    changePage(page + 1);
  }, [changePage, page]);

  const previousPage = useCallback(() => {
    changePage(page - 1);
  }, [changePage, page]);

  useEffect(() => {
    setPage(0);
    setProgressKey(value => value + 1);
  }, [products]);

  useEffect(() => {
    if (paused || pageCount <= 1) {
      return;
    }

    const timeout = window.setTimeout(() => {
      nextPage();
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    paused,
    page,
    pageCount,
    progressKey,
    nextPage,
  ]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="featured-heading"
      className="mb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2
            id="featured-heading"
            className="text-[1.75rem] leading-tight font-medium tracking-tight"
          >
            Featured
          </h2>

          {pageCount > 1 && (
            <p className="mt-1.5 text-[13px] text-muted">
              {page + 1} / {pageCount}
            </p>
          )}
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous featured products"
              onClick={previousPage}
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted outline-none transition-colors hover:border-line-strong hover:text-fg focus-visible:border-accent/60"
            >
              <span
                aria-hidden="true"
                className="text-lg leading-none"
              >
                ←
              </span>
            </button>

            <button
              type="button"
              aria-label="Next featured products"
              onClick={nextPage}
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted outline-none transition-colors hover:border-line-strong hover:text-fg focus-visible:border-accent/60"
            >
              <span
                aria-hidden="true"
                className="text-lg leading-none"
              >
                →
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
        {currentProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-8">
          <div
            className="h-px w-full overflow-hidden bg-line"
            aria-hidden="true"
          >
            <div
              key={progressKey}
              className="h-full origin-left bg-accent"
              style={{
                animation: `featured-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
                animationPlayState: paused
                  ? "paused"
                  : "running",
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to featured page ${index + 1}`}
                aria-current={
                  page === index ? "page" : undefined
                }
                onClick={() => changePage(index)}
                className="group flex h-5 items-center outline-none"
              >
                <span
                  className={[
                    "block h-px transition-all duration-300",
                    page === index
                      ? "w-8 bg-fg"
                      : "w-4 bg-line-strong group-hover:w-6 group-hover:bg-muted",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes featured-progress {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </section>
  );
}