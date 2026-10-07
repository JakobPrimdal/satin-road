import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  getAllProducts,
  getCategories,
  getOrders,
  type Category,
  type Order,
  type Product,
} from "@/lib/api";

type Status = "loading" | "ready" | "error";

interface AdminData {
  status: Status;
  error: string | null;
  refreshing: boolean;
  reload: () => Promise<void>;
  categories: Category[];
  listings: Product[];
  orders: Order[];
  categoryName: (id: number) => string | undefined;
  patchListing: (id: number, changes: Partial<Product>) => void;
  dropListing: (id: number) => void;
  setCategories: (update: (current: Category[]) => Category[]) => void;
}

const AdminContext = createContext<AdminData | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [listings, setListings] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextCategories, all, nextOrders] = await Promise.all([getCategories(), getAllProducts(), getOrders()]);
      setCategoriesState(nextCategories);
      setListings(all.sort((a, b) => b.id - a.id));
      setOrders(nextOrders.sort((a, b) => b.id - a.id));
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setStatus(current => (current === "ready" ? "ready" : "error"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<AdminData>(() => {
    const names = new Map(categories.map(category => [category.id, category.name]));
    return {
      status,
      error,
      refreshing,
      reload,
      categories,
      listings,
      orders,
      categoryName: id => names.get(id),
      patchListing: (id, changes) => setListings(current => current.map(p => (p.id === id ? { ...p, ...changes } : p))),
      dropListing: id => setListings(current => current.filter(p => p.id !== id)),
      setCategories: update => setCategoriesState(current => update(current)),
    };
  }, [status, error, refreshing, reload, categories, listings, orders]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminData {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside AdminDataProvider");
  return value;
}
