import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Wordmark } from "@/components/Logo";
import { isAdmin, setSession, useSession } from "@/lib/session";
import { useMarket } from "./MarketData";
import { SearchBox } from "./SearchBox";

export function Navbar() {
  return (
    <header className="grain sticky top-0 z-30 border-b border-line">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-4 pt-3 sm:grid-cols-[auto_minmax(0,36rem)_1fr] sm:px-6">
        <Link to="/market" className="col-start-1 row-start-1 justify-self-start rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          <Wordmark />
        </Link>
        <div className="col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <SearchBox />
        </div>
        <Account />
      </div>
      <CategoryRail />
    </header>
  );
}

function Account() {
  const session = useSession();
  const navigate = useNavigate();

  function signOut() {
    setSession(null);
    navigate("/", { replace: true });
  }

  return (
    <div className="col-start-2 row-start-1 flex items-center justify-end gap-4 text-sm sm:col-start-3">
      <span className="flex min-w-0 items-center gap-2 text-muted">
        <span className="truncate">{session?.user.username}</span>
        {isAdmin(session) && (
          <span className="rounded border border-line-strong px-1.5 py-px text-[11px] text-accent">Admin</span>
        )}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="shrink-0 rounded text-faint underline-offset-4 outline-none transition-colors hover:text-fg focus-visible:text-fg focus-visible:underline"
      >
        Sign out
      </button>
    </div>
  );
}

function CategoryRail() {
  const { categories } = useMarket();
  const location = useLocation();
  const [params] = useSearchParams();
  const railRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<{ left: number; width: number } | null>(null);

  const onListings = location.pathname === "/market";
  const active = onListings ? (params.get("category") ?? "all") : null;

  function hrefFor(categoryId: number | null) {
    const next = new URLSearchParams(onListings ? params : undefined);
    if (categoryId === null) next.delete("category");
    else next.set("category", String(categoryId));
    const search = next.toString();
    return `/market${search ? `?${search}` : ""}`;
  }

  useLayoutEffect(() => {
    const rail = railRef.current;
    const label = rail?.querySelector<HTMLElement>("[aria-current='page'] > span");
    if (!rail || !label) {
      setThread(null);
      return;
    }
    const measure = () => setThread({ left: label.offsetLeft, width: label.offsetWidth });
    measure();
    const visibleLeft = label.offsetLeft - rail.scrollLeft;
    if (visibleLeft < 0 || visibleLeft + label.offsetWidth > rail.clientWidth) {
      rail.scrollTo({ left: label.offsetLeft - 24, behavior: "smooth" });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [active, categories]);

  const items = [{ id: null, key: "all", name: "All listings" }, ...categories.map(c => ({ id: c.id, key: String(c.id), name: c.name }))];

  return (
    <nav aria-label="Categories" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div ref={railRef} className="no-scrollbar relative -mx-1 flex overflow-x-auto px-1">
        {items.map(item => (
          <Link
            key={item.key}
            to={hrefFor(item.id)}
            aria-current={active === item.key ? "page" : undefined}
            className="shrink-0 px-3 py-3 text-sm whitespace-nowrap text-muted outline-none transition-colors first:pl-0 hover:text-fg focus-visible:text-fg focus-visible:underline focus-visible:underline-offset-4 aria-[current=page]:text-fg"
          >
            <span>{item.name}</span>
          </Link>
        ))}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-accent transition-[translate,width,opacity] duration-300 ease-out ${thread ? "opacity-100" : "opacity-0"}`}
          style={thread ? { width: thread.width, translate: `${thread.left}px 0` } : undefined}
        />
      </div>
    </nav>
  );
}
