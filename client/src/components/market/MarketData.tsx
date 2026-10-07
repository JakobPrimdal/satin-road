import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, getCategories, getProducts, type Category, type Product } from "@/lib/api";

type Status = "loading" | "ready" | "error";

interface MarketData {
  categories: Category[];
  products: Product[];
  status: Status;
  error: string | null;
  reload: () => Promise<void>;
  categoryName: (id: number) => string | undefined;
}

const MarketContext = createContext<MarketData | null>(null);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextCategories, nextProducts] = await Promise.all([getCategories(), getProducts()]);
      setCategories(nextCategories);
      setProducts(nextProducts.filter(product => product.isActive));
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setStatus(current => (current === "ready" ? "ready" : "error"));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<MarketData>(() => {
    const names = new Map(categories.map(category => [category.id, category.name]));
    return { categories, products, status, error, reload, categoryName: id => names.get(id) };
  }, [categories, products, status, error, reload]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketData {
  const value = useContext(MarketContext);
  if (!value) throw new Error("useMarket must be used inside MarketDataProvider");
  return value;
}
