import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { MarketDataProvider } from "@/components/market/MarketData";
import { Navbar } from "@/components/market/Navbar";
import { useSession } from "@/lib/session";

export function MarketLayout() {
  const session = useSession();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!session) return <Navigate to="/" replace />;

  return (
    <MarketDataProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-10 pb-24 sm:px-6">
          <Outlet />
        </main>
      </div>
    </MarketDataProvider>
  );
}
