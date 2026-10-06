import type { Product } from "./api";

const priceFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatPrice(price: number): string {
  return priceFormat.format(price);
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function stockLabel(stock: number): string {
  return stock > 0 ? `${stock} in stock` : "Sold out";
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

export function pickFeatured(products: Product[], count = 5): Product[] {
  return products
    .filter(product => product.images.length > 0 && product.stock > 0)
    .sort((a, b) => b.id - a.id)
    .slice(0, count);
}
