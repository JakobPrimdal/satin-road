import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Product } from "@/lib/api";
import { ProductCard } from "./ProductCard";

const PER_PAGE = 3;
const SWAP_MS = 6000;

function toPages(products: Product[]): Product[][] {
  if (products.length <= PER_PAGE) return [products];
  const count = Math.ceil(products.length / PER_PAGE);
  return Array.from({ length: count }, (_, page) =>
    Array.from({ length: PER_PAGE }, (_, slot) => products[(page * PER_PAGE + slot) % products.length]!),
  );
}

export function FeaturedCarousel({ products }: { products: Product[] }) {
  const pages = useMemo(() => toPages(products), [products]);
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const page = index % pages.length;
  const rotating = pages.length > 1;
  const paused = hovered || focused;

  function go(next: number) {
    setIndex((next + pages.length) % pages.length);
    setCycle(n => n + 1);
  }

  return (
    <section
      aria-labelledby="featured-heading"
      aria-roledescription="carousel"
      className="mb-20"
      onPointerEnter={event => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={event => event.target.matches(":focus-visible") && setFocused(true)}
      onBlur={event => !event.currentTarget.contains(event.relatedTarget as Node | null) && setFocused(false)}
    >
      <div className={`flex items-end justify-between gap-6 ${rotating ? "mb-5" : "mb-8"}`}>
        <div>
          <h2 id="featured-heading" className="text-[1.75rem] leading-tight font-medium tracking-tight">
            Featured
          </h2>
          <p className="mt-1.5 text-[15px] text-muted">Over 100 sold each</p>
        </div>
        {rotating && (
          <div className="flex items-center gap-1">
            <span className="mr-2 text-[13px] text-muted tabular-nums">
              {page + 1} / {pages.length}
            </span>
            <StepButton label="Previous featured listings" onClick={() => go(page - 1)}>
              <ChevronLeftIcon className="size-4" />
            </StepButton>
            <StepButton label="Next featured listings" onClick={() => go(page + 1)}>
              <ChevronRightIcon className="size-4" />
            </StepButton>
          </div>
        )}
      </div>

      {rotating && (
        <div aria-hidden="true" className="mb-8 h-0.5 overflow-hidden rounded-full bg-line">
          <div
            key={cycle}
            onAnimationEnd={() => go(page + 1)}
            className={`h-full animate-drain rounded-full transition-colors duration-300 ${paused ? "bg-muted" : "bg-accent"}`}
            style={{ animationDuration: `${SWAP_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
          />
        </div>
      )}

      <div className="grid" aria-live={paused ? "polite" : "off"}>
        {pages.map((items, i) => {
          const active = i === page;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${pages.length}`}
              inert={!active}
              className={`col-start-1 row-start-1 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-3 ${active ? "" : "pointer-events-none"}`}
            >
              {items.map((product, slot) => (
                <div
                  key={product.id}
                  className={`transition-[opacity,translate,visibility] ease-out ${active ? "duration-500" : "invisible translate-y-2 opacity-0 duration-200"}`}
                  style={{ transitionDelay: active ? `${150 + slot * 80}ms` : "0ms" }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-line text-muted outline-none transition-colors hover:border-line-strong hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {children}
    </button>
  );
}
