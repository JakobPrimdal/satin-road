import type { Order } from "./api";

export const LOYALTY_ORDERS = 10;
export const LOYALTY_PERCENT = 20;

export function ordersPerVendor(orders: Order[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const order of orders) {
    for (const vendorId of new Set(order.items.map(item => item.vendorId))) {
      counts.set(vendorId, (counts.get(vendorId) ?? 0) + 1);
    }
  }
  return counts;
}

export function loyaltyPercent(priorOrders: number): number {
  return priorOrders > LOYALTY_ORDERS ? LOYALTY_PERCENT : 0;
}

export function discounted(price: number, percent: number): number {
  return Math.round(price * (1 - percent / 100) * 1e8) / 1e8;
}
