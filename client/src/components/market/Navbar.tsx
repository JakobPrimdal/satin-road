import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router";
import { Menu } from "@base-ui/react/menu";
import { BagIcon, ChevronDownIcon, PlusIcon, WalletIcon } from "@/components/icons";
import { Wordmark } from "@/components/Logo";
import { ThreadRail, type RailItem } from "@/components/ThreadRail";
import { formatPrice, plural } from "@/lib/format";
import { useCart, useWallet } from "@/lib/local";
import { isAdmin, setSession, useSession } from "@/lib/session";
import { useMarket } from "./MarketData";
import { SearchBox } from "./SearchBox";
import { VendorMark } from "./VendorMark";

export function Navbar() {
  return (
    <header className="grain sticky top-0 z-30 border-b border-line">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-4 pt-3 sm:grid-cols-[auto_minmax(0,34rem)_1fr] sm:px-6">
        <Link to="/market" className="col-start-1 row-start-1 justify-self-start rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          <Wordmark />
        </Link>
        <div className="col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <SearchBox />
        </div>
        <Actions />
      </div>
      <CategoryRail />
    </header>
  );
}

function Actions() {
  const session = useSession();
  const cart = useCart();
  const wallet = useWallet();

  return (
    <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 sm:col-start-3">
      <p className="hidden h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm lg:flex" title="Wallet balance">
        <WalletIcon className="size-4 text-accent" />
        <span className="sr-only">Wallet balance</span>
        <span className="text-fg">{formatPrice(wallet.balance)}</span>
      </p>
      {isAdmin(session) && (
        <Link
          to="/admin"
          className="hidden h-10 items-center rounded-lg px-3 text-sm text-accent outline-none transition-colors hover:bg-field focus-visible:ring-2 focus-visible:ring-accent/40 md:flex"
        >
          Admin
        </Link>
      )}
      <NavLink
        to="/market/listings/new"
        className="hidden h-10 items-center gap-1.5 rounded-lg border border-line-strong px-3.5 text-sm text-fg outline-none transition-colors hover:bg-field focus-visible:ring-2 focus-visible:ring-accent/40 aria-[current=page]:bg-field md:flex"
      >
        <PlusIcon className="size-4" />
        Sell
      </NavLink>
      <NavLink
        to="/market/cart"
        aria-label={`Cart, ${plural(cart.count, "item")}`}
        className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted outline-none transition-colors hover:bg-field hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 aria-[current=page]:bg-field aria-[current=page]:text-fg"
      >
        <BagIcon className="size-[18px]" />
        <span className="hidden sm:inline">Cart</span>
        {cart.count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-canvas">
            {cart.count}
          </span>
        )}
      </NavLink>
      <AccountMenu />
    </div>
  );
}

export function AccountMenu() {
  const session = useSession();
  const navigate = useNavigate();
  const wallet = useWallet();
  if (!session) return null;

  function signOut() {
    setSession(null);
    navigate("/", { replace: true });
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Account menu for ${session.user.username}`}
        className="flex h-10 items-center gap-1 rounded-lg pr-1.5 pl-1 text-faint outline-none transition-colors hover:bg-field hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 data-popup-open:bg-field data-popup-open:text-fg"
      >
        <VendorMark vendorId={session.user.userId} className="size-8" />
        <ChevronDownIcon className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-40 outline-none" sideOffset={8} align="end">
          <Menu.Popup className="w-64 origin-(--transform-origin) rounded-lg border border-line-strong bg-raised p-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)] outline-none transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <div className="flex items-center gap-3 px-2.5 pt-2.5 pb-3">
              <VendorMark vendorId={session.user.userId} className="size-10" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[15px] text-fg">
                  <span className="truncate">{session.user.username}</span>
                  {isAdmin(session) && (
                    <span className="rounded border border-line-strong px-1.5 py-px text-[11px] text-accent">Admin</span>
                  )}
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{formatPrice(wallet.balance)} in your wallet</p>
              </div>
            </div>
            <Menu.Separator className="mx-1 my-1 h-px bg-line" />
            {isAdmin(session) && (
              <Menu.LinkItem render={<Link to="/admin" />} className={adminItemClass}>
                Admin dashboard
              </Menu.LinkItem>
            )}
            <Menu.LinkItem render={<Link to="/market" />} className={menuItemClass}>
              Market
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link to="/market/orders" />} className={menuItemClass}>
              Orders
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link to="/market/listings" />} className={menuItemClass}>
              My listings
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link to="/market/listings/new" />} className={menuItemClass}>
              Create a listing
            </Menu.LinkItem>
            <Menu.Separator className="mx-1 my-1 h-px bg-line" />
            <Menu.Item onClick={signOut} className={menuItemClass}>
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const itemBase = "flex cursor-default rounded-md px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-field";
const menuItemClass = `${itemBase} text-muted data-highlighted:text-fg`;
const adminItemClass = `${itemBase} text-accent`;

function CategoryRail() {
  const { categories } = useMarket();
  const location = useLocation();
  const [params] = useSearchParams();

  const onListings = location.pathname === "/market";
  const active = onListings && !params.get("vendor") ? (params.get("category") ?? "all") : null;

  function hrefFor(categoryId: number | null) {
    const next = new URLSearchParams(onListings ? params : undefined);
    next.delete("vendor");
    if (categoryId === null) next.delete("category");
    else next.set("category", String(categoryId));
    const search = next.toString();
    return `/market${search ? `?${search}` : ""}`;
  }

  const items: RailItem[] = [
    { key: "all", to: hrefFor(null), label: "All listings", active: active === "all" },
    ...categories.map(c => ({ key: String(c.id), to: hrefFor(c.id), label: c.name, active: active === String(c.id) })),
  ];

  return <ThreadRail label="Categories" items={items} />;
}
