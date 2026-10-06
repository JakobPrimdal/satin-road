import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { SearchIcon } from "@/components/icons";
import { Spinner } from "@/components/ui";
import { ApiError, searchProducts, type Product } from "@/lib/api";
import { formatPrice, primaryImage } from "@/lib/format";
import { useSession } from "@/lib/session";
import { ProductPhoto } from "./ProductPhoto";

export function visibleResults(results: Product[], userId: string | undefined): Product[] {
  return results.filter(product => product.status === "Approved" && product.isActive && product.vendorId !== userId);
}

export function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const session = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const highlighted = useRef<Product | undefined>(undefined);
  const urlQuery = location.pathname === "/market" ? (params.get("q") ?? "") : "";

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term || term === urlQuery) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      searchProducts(term, controller.signal)
        .then(found => {
          setResults(visibleResults(found, session?.user.userId).slice(0, 6));
          setError(null);
        })
        .catch(err => {
          if (controller.signal.aborted) return;
          setResults([]);
          setError(err instanceof ApiError ? err.message : "Search failed.");
        })
        .finally(() => !controller.signal.aborted && setSearching(false));
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, urlQuery, session?.user.userId]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const term = query.trim();
    const next = new URLSearchParams(location.pathname === "/market" ? params : undefined);
    if (term) next.set("q", term);
    else next.delete("q");
    inputRef.current?.blur();
    navigate({ pathname: "/market", search: next.toString() ? `?${next}` : "" });
  }

  const term = query.trim();
  const status = searching
    ? "Searching…"
    : error
      ? error
      : term && term !== urlQuery && results.length === 0
        ? `No listings match “${term}”.`
        : null;

  return (
    <form role="search" onSubmit={submit} className="w-full">
      <Autocomplete.Root
        items={results}
        value={query}
        onValueChange={(value, details) => {
          if (details.reason !== "item-press") setQuery(value);
        }}
        itemToStringValue={(product: Product) => product.title}
        onItemHighlighted={item => {
          highlighted.current = item;
        }}
        filter={null}
      >
        <label className="group/search relative flex items-center">
          <span className="sr-only">Search listings</span>
          <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-faint" />
          <Autocomplete.Input
            ref={inputRef}
            placeholder="Search listings"
            className="peer h-10 w-full rounded-lg border border-line bg-field pr-10 pl-10 text-[15px] text-fg caret-accent outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/10 any-pointer-coarse:text-base [&::-webkit-search-cancel-button]:hidden"
            type="search"
            enterKeyHint="search"
            onKeyDown={event => {
              if (event.key === "Enter" && !highlighted.current) {
                event.preventDefault();
                submit();
              }
            }}
          />
          {searching ? (
            <span className="pointer-events-none absolute right-3.5 text-faint">
              <Spinner />
            </span>
          ) : (
            <kbd className="pointer-events-none absolute right-3 hidden h-5 min-w-5 place-items-center rounded border border-line-strong px-1 font-sans text-xs text-faint peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden sm:grid">
              /
            </kbd>
          )}
        </label>

        <Autocomplete.Portal hidden={!status && results.length === 0}>
          <Autocomplete.Positioner className="z-40 outline-none" sideOffset={6} align="start">
            <Autocomplete.Popup className="w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-lg border border-line-strong bg-raised shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)]">
              <Autocomplete.Status>
                {status && <div className="px-3.5 py-3 text-[13px] text-muted">{status}</div>}
              </Autocomplete.Status>
              <Autocomplete.List className="max-h-[min(var(--available-height),24rem)] overflow-y-auto p-1">
                {(product: Product) => (
                  <Autocomplete.Item
                    key={product.id}
                    value={product}
                    onClick={() => {
                      inputRef.current?.blur();
                      navigate(`/market/product/${product.id}`);
                    }}
                    className="flex cursor-default items-center gap-3 rounded-md px-2.5 py-2 outline-none select-none data-highlighted:bg-field"
                  >
                    <ProductPhoto imageId={primaryImage(product)?.id} alt="" eager className="size-10 shrink-0 rounded-md" />
                    <span className="min-w-0 flex-1 truncate text-[15px]">{product.title}</span>
                    <span className="shrink-0 text-[13px] text-muted">{formatPrice(product.price)}</span>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
              {results.length > 0 && (
                <div className="border-t border-line px-3.5 py-2.5 text-[13px] text-faint">
                  Press Enter to see every match for “{term}”.
                </div>
              )}
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </form>
  );
}
