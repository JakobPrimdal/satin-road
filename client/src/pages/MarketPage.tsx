import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { useMarket } from "@/components/market/MarketData";
import { ProductCard, ProductCardSkeleton } from "@/components/market/ProductCard";
import { visibleResults } from "@/components/market/SearchBox";
import { SortSelect } from "@/components/market/SortSelect";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { VendorMark } from "@/components/market/VendorMark";
import { Button, threadClass } from "@/components/ui";
import { ApiError, searchProducts, type Product } from "@/lib/api";
import { pickFeatured, plural, primaryImage, shortId, sortProducts, toSortKey } from "@/lib/format";
import { useSession } from "@/lib/session";

type SearchState = { status: "idle" | "loading" | "ready" | "error"; results: Product[]; error: string | null };

function useSearch(query: string, userId: string | undefined, attempt: number): SearchState {
  const [state, setState] = useState<SearchState>({ status: "idle", results: [], error: null });

  useEffect(() => {
    if (!query) {
      setState({ status: "idle", results: [], error: null });
      return;
    }
    const controller = new AbortController();
    setState(current => ({ ...current, status: "loading", error: null }));
    searchProducts(query, controller.signal)
      .then(found => setState({ status: "ready", results: visibleResults(found, userId), error: null }))
      .catch(err => {
        if (controller.signal.aborted) return;
        setState({ status: "error", results: [], error: err instanceof ApiError ? err.message : "Search failed." });
      });
    return () => controller.abort();
  }, [query, userId, attempt]);

  return state;
}

export function MarketPage() {
  const market = useMarket();
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const [featuredPool, setFeaturedPool] = useState<Product[]>([]);

  const query = params.get("q")?.trim() ?? "";
  const categoryId = Number(params.get("category")) || null;
  const sort = toSortKey(params.get("sort"));
  const search = useSearch(query, session?.user.userId, attempt);

  const vendorId = params.get("vendor");
  const isHome = !query && !categoryId && !vendorId;

  useEffect(() => {
    if (!isHome) return;

    pickFeatured()
      .then(setFeaturedPool)
      .catch(err => console.error("Failed to load featured products:", err));
  }, [isHome]);

  const category = categoryId ? market.categories.find(c => c.id === categoryId) : undefined;

  const featured = isHome ? featuredPool.slice(0, featuredPool.length >= 5 ? 5 : featuredPool.length >= 3 ? 3 : 0): [];
  const featuredIds = new Set(featured.map(p => p.id));
  const listings = sortProducts(
    (query ? search.results : market.products).filter(
      p =>
        (!categoryId || p.categoryId === categoryId) &&
        (!vendorId || p.vendorId === vendorId) &&
        !featuredIds.has(p.id),
    ),
    sort,
  );

  const loading = market.status === "loading" || (query !== "" && (search.status === "loading" || search.status === "idle"));
  const error = market.status === "error" ? market.error : query && search.status === "error" ? search.error : null;
  const unknownCategory = categoryId !== null && market.status === "ready" && !category;

  function setSort(next: string) {
    const nextParams = new URLSearchParams(params);
    if (next === "newest") nextParams.delete("sort");
    else nextParams.set("sort", next);
    setParams(nextParams, { replace: true });
  }

  const vendorName = vendorId
    ? market.products.find(p => p.vendorId === vendorId)?.vendorUsername || `Vendor ${shortId(vendorId)}`
    : null;
  const title = query
    ? `Results for “${query}”`
    : (vendorName ?? category?.name ?? (featured.length > 0 ? "More listings" : "All listings"));
  const pageTitle = query
    ? `${query} - Satin Road`
    : vendorName
      ? `${vendorName} - Satin Road`
      : category
        ? `${category.name} - Satin Road`
        : "Market - Satin Road";
  const countLabel = [
    plural(listings.length, featured.length > 0 ? "more listing" : "listing"),
    (query || vendorId) && category ? `in ${category.name}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const Heading = isHome ? "h2" : "h1";

  return (
    <>
      <title>{pageTitle}</title>
      {isHome && <h1 className="sr-only">Market</h1>}

      {featured.length > 0 && <Featured products={featured} />}
      {isHome && market.status === "ready" && <CategoryTiles />}

      <section aria-labelledby="listings-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-4">
            {vendorId && <VendorMark vendorId={vendorId} className="size-12" />}
            <div className="min-w-0">
              <Heading id="listings-heading" className="text-[1.75rem] leading-tight font-medium tracking-tight">
                {title}
              </Heading>
              {!loading && !error && !unknownCategory && listings.length > 0 && (
                <p className="mt-1.5 text-[15px] text-muted">{countLabel}</p>
              )}
            </div>
          </div>
          {listings.length > 1 && !loading && <SortSelect value={sort} onChange={setSort} />}
        </div>

        {error ? (
          <Message title="The listings couldn't be loaded." body={error}>
            <Button
              className="mt-6"
              onClick={() => {
                if (market.status === "error") market.reload();
                else setAttempt(n => n + 1);
              }}
            >
              Try again
            </Button>
          </Message>
        ) : loading ? (
          <ListingGrid>
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </ListingGrid>
        ) : unknownCategory ? (
          <Message title="That category doesn't exist." body="It may have been renamed or removed.">
            <BrowseAll />
          </Message>
        ) : listings.length === 0 ? (
          <EmptyListings
            query={query}
            categoryName={category?.name}
            vendorName={vendorName}
            hasAnyListings={market.products.length > 0}
          />
        ) : (
          <ListingGrid>
            {listings.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ListingGrid>
        )}
      </section>
    </>
  );
}

function Featured({ products }: { products: Product[] }) {
  const [lead, ...rest] = products;
  if (!lead) return null;

  return (
    <section aria-labelledby="featured-heading" className="mb-20">
      <h2 id="featured-heading" className="mb-8 text-[1.75rem] leading-tight font-medium tracking-tight">
        Featured
      </h2>
      <div className={`grid gap-x-5 gap-y-10 sm:grid-cols-2 ${rest.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <div className="sm:col-span-2 lg:row-span-2">
          <ProductCard product={lead} lead />
        </div>
        {rest.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function CategoryTiles() {
  const { categories, products } = useMarket();
  const tiles = categories
    .map(category => {
      const inCategory = products.filter(p => p.categoryId === category.id);
      const cover = sortProducts(inCategory.filter(p => p.images.length > 0), "newest")[0];
      return { category, count: inCategory.length, cover };
    })
    .filter(tile => tile.count > 0);

  if (tiles.length < 2) return null;

  return (
    <section aria-labelledby="categories-heading" className="mb-20">
      <h2 id="categories-heading" className="mb-8 text-[1.75rem] leading-tight font-medium tracking-tight">
        Browse categories
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ category, count, cover }) => (
          <li key={category.id}>
            <Link
              to={`/market?category=${category.id}`}
              className="group/tile relative flex items-center gap-4 rounded-lg border border-line bg-surface p-3 outline-none transition-colors hover:border-line-strong focus-visible:border-accent/60"
            >
              <ProductPhoto imageId={cover ? primaryImage(cover)?.id : undefined} alt="" className="size-14 shrink-0 rounded-md" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] text-fg">{category.name}</span>
                <span className="mt-0.5 block text-[13px] text-muted">{plural(count, "listing")}</span>
              </span>
              <span
                aria-hidden="true"
                className={`${threadClass} border-accent [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-300 ease-out group-hover/tile:[clip-path:inset(0)] group-focus-visible/tile:[clip-path:inset(0)]`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListingGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function EmptyListings({
  query,
  categoryName,
  vendorName,
  hasAnyListings,
}: {
  query: string;
  categoryName?: string;
  vendorName: string | null;
  hasAnyListings: boolean;
}) {
  if (vendorName && !query) {
    return (
      <Message title={`${vendorName} has nothing for sale right now.`} body="Their listings show up here once they're approved and in stock.">
        {hasAnyListings && <BrowseAll />}
      </Message>
    );
  }
  if (query) {
    return (
      <Message
        title={`No listings match “${query}”${categoryName ? ` in ${categoryName}` : ""}.`}
        body="Check the spelling, or try a shorter search."
      >
        {categoryName && (
          <Link to={`/market?q=${encodeURIComponent(query)}`} className={linkClass}>
            Search all categories
          </Link>
        )}
      </Message>
    );
  }
  if (categoryName) {
    return (
      <Message title={`Nothing in ${categoryName} yet.`} body="New listings show up here once they're approved.">
        {hasAnyListings && <BrowseAll />}
      </Message>
    );
  }
  return <Message title="Nothing is listed yet." body="New listings show up here once they're approved." />;
}

function Message({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line px-6 py-16 text-center">
      <p className="text-lg font-medium tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{body}</p>
      {children}
    </div>
  );
}

const linkClass = "mt-6 inline-block text-[15px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline";

function BrowseAll() {
  return (
    <Link to="/market" className={linkClass}>
      Browse all listings
    </Link>
  );
}
