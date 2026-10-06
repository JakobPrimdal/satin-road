import { useCallback, useSyncExternalStore } from "react";
import { useSession } from "./session";

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readJson<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  try {
    if (raw !== null) value = JSON.parse(raw) as T;
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function useStored<T>(key: string | null, fallback: T): [T, (next: T) => void] {
  const value = useSyncExternalStore(subscribe, () => (key ? readJson(key, fallback) : fallback));
  const set = useCallback((next: T) => key && writeJson(key, next), [key]);
  return [value, set];
}

export interface CartLine {
  productId: number;
  quantity: number;
}

const noLines: CartLine[] = [];

export function useCart() {
  const session = useSession();
  const [lines, setLines] = useStored<CartLine[]>(session ? `satin-road.cart.${session.user.userId}` : null, noLines);

  function quantityOf(productId: number) {
    return lines.find(line => line.productId === productId)?.quantity ?? 0;
  }

  function setQuantity(productId: number, quantity: number) {
    const rest = lines.filter(line => line.productId !== productId);
    const index = lines.findIndex(line => line.productId === productId);
    if (quantity <= 0) return setLines(rest);
    const next = [...rest];
    next.splice(index === -1 ? next.length : index, 0, { productId, quantity });
    setLines(next);
  }

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    quantityOf,
    add: (productId: number, quantity: number) => setQuantity(productId, quantityOf(productId) + quantity),
    setQuantity,
    remove: (productId: number) => setQuantity(productId, 0),
    removeAll: (productIds: number[]) => setLines(lines.filter(line => !productIds.includes(line.productId))),
    clear: () => setLines(noLines),
  };
}

export const STARTING_BALANCE = 10_000;

export function useWallet() {
  const session = useSession();
  const [balance, setBalance] = useStored<number>(
    session ? `satin-road.wallet.${session.user.userId}` : null,
    STARTING_BALANCE,
  );

  return {
    balance,
    spend: (amount: number) => setBalance(Math.max(0, roundBtc(balance - amount))),
  };
}

export function roundBtc(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}
