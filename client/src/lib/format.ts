import type { Product } from "./api";

const btcFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });

export function formatPrice(price: number): string {
  return `₿${btcFormat.format(price)}`;
}

export function plural(count: number, word: string, many = `${word}s`): string {
  return `${count} ${count === 1 ? word : many}`;
}

export function stockLabel(stock: number): string {
  if (stock <= 0) return "Sold out";
  if (stock <= 3) return `Only ${stock} left`;
  return `${stock} in stock`;
}

export function stockTone(stock: number): string {
  if (stock <= 0) return "text-danger";
  if (stock <= 3) return "text-accent";
  return "text-faint";
}

export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

export function primaryImage(product: Product) {
  return product.images.find(image => image.isPrimary) ?? product.images[0];
}

export type SortKey = "newest" | "price-asc" | "price-desc";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function toSortKey(value: string | null): SortKey {
  return sortOptions.some(option => option.value === value) ? (value as SortKey) : "newest";
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const sorted = [...products];
  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price || b.id - a.id);
  else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price || b.id - a.id);
  else sorted.sort((a, b) => b.id - a.id);
  return sorted;
}
