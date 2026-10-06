import {
  Api,
  type CategoryResponseDTO,
  type HttpResponse,
  type OrderResponseDTO,
  type ProblemDetails,
  type ProductResponseDTO,
  type UserDto,
} from "@/generated/api";
import { getSession, setSession, type Session } from "./session";

export const API_URL = envApiUrl() || "http://localhost:5120";

function envApiUrl(): string | undefined {
  try {
    return process.env.BUN_PUBLIC_API_URL;
  } catch {
    return undefined;
  }
}

const api = new Api({
  baseUrl: API_URL,
  securityWorker: () => {
    const session = getSession();
    return session ? { headers: { Authorization: `Bearer ${session.token}` } } : {};
  },
});

export interface Credentials {
  username: string;
  password: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  vendorId: string;
  status: string;
  isActive: boolean;
  images: ProductImage[];
}

export interface OrderLine {
  productId: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerId: string;
  purchasedAt: Date;
  items: { productId: number; title: string; quantity: number; vendorId: string }[];
}

export interface ListingInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (err) {
    if (err instanceof Response) throw toApiError(err as HttpResponse<unknown, ProblemDetails | null>);
    if (err instanceof TypeError) throw new ApiError("Couldn't reach the server.", 0);
    throw err;
  }
}

function toApiError(res: HttpResponse<unknown, ProblemDetails | null>): ApiError {
  const problem = res.error && typeof res.error === "object" ? res.error : null;

  if (res.status === 401 && getSession()) {
    setSession(null);
    return new ApiError("Your session has expired. Sign in again.", 401);
  }

  const message =
    res.status >= 500
      ? "Something went wrong on the server."
      : (problem?.detail ??
        (res.status === 404 ? "The requested resource was not found." : (problem?.title ?? `Request failed (${res.status})`)));
  return new ApiError(message, res.status);
}

function toUser(dto: UserDto | undefined, fallbackName: string): Session["user"] {
  return { userId: dto?.userId ?? "", username: dto?.username ?? fallbackName, role: dto?.role ?? "User" };
}

function toCategory(dto: CategoryResponseDTO): Category {
  return { id: dto.id ?? 0, name: dto.name ?? "" };
}

function toProduct(dto: ProductResponseDTO): Product {
  return {
    id: dto.id ?? 0,
    title: dto.title ?? "",
    description: dto.description ?? "",
    price: dto.price ?? 0,
    stock: dto.stock ?? 0,
    categoryId: dto.categoryId ?? 0,
    vendorId: dto.vendorId ?? "",
    status: dto.status ?? "",
    isActive: dto.isActive ?? true,
    images: (dto.images ?? [])
      .map(image => ({ id: image.id ?? 0, isPrimary: image.isPrimary ?? false, sortOrder: image.sortOrder ?? 0 }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export const register = (credentials: Credentials) =>
  call(() => api.register.authRegister(credentials)).then(dto => toUser(dto, credentials.username));

export const login = (credentials: Credentials) =>
  call(() => api.login.authLogin(credentials, { format: "json" }) as Promise<{ token: string; user: UserDto }>).then(
    (res): Session => ({ token: res.token, user: toUser(res.user, credentials.username) }),
  );

export const getCategories = () => call(() => api.getCategories.categoryGetCategories()).then(list => list.map(toCategory));

export const getProducts = () => call(() => api.getProducts.productGetProducts()).then(list => list.map(toProduct));

export const getProduct = (id: number) => call(() => api.getProduct.productGetProduct({ id })).then(toProduct);

export const searchProducts = (search: string, signal?: AbortSignal) =>
  call(() => api.searchProducts.productSearchProducts({ search }, { signal })).then(list => list.map(toProduct));

export const getImage = (imageId: number, signal?: AbortSignal) =>
  call(() => api.getImage.productGetImage({ imageId }, { format: "blob", signal }));

function parseUtc(value: string | undefined): Date {
  if (!value) return new Date(0);
  return new Date(/(z|[+-]\d\d:?\d\d)$/i.test(value) ? value : `${value}Z`);
}

function toOrder(dto: OrderResponseDTO): Order {
  return {
    id: dto.id ?? 0,
    customerId: dto.customerId ?? "",
    purchasedAt: parseUtc(dto.purchasedAtUtc),
    items: (dto.products ?? []).map(item => ({
      productId: item.productId ?? 0,
      title: item.productTitle ?? "",
      quantity: item.quantity ?? 0,
      vendorId: item.vendorId ?? "",
    })),
  };
}

export const placeOrder = (lines: OrderLine[]) =>
  call(() =>
    api.placeOrder.orderPlaceOrder({
      products: lines.map(line => ({ productid: line.productId, quantity: line.quantity })),
    }),
  ).then(toOrder);

export const getOrders = () => call(() => api.getOrders.orderGetOrders()).then(list => list.map(toOrder));

export const getMyProducts = () => call(() => api.getMyProducts.productGetMyProducts()).then(list => list.map(toProduct));

function toForm(input: ListingInput) {
  return {
    Title: input.title,
    Description: input.description,
    Price: input.price,
    Stock: input.stock,
    CategoryId: input.categoryId,
  };
}

export const createProduct = (input: ListingInput) =>
  call(() => api.createProduct.productCreateProduct(toForm(input))).then(toProduct);

export const updateProduct = (id: number, input: ListingInput) =>
  call(() => api.updateProduct.productUpdateProduct(toForm(input), { id })).then(toProduct);

export const deleteProduct = (id: number) => call(() => api.deleteProduct.productDeleteProduct({ id }, { format: "json" }));

export const uploadImages = (productId: number, files: File[]) => {
  const form = new FormData();
  files.forEach(file => form.append("files", file));
  return call(() => api.uploadImages.productUploadImages(form as { files?: File[] }, { productId }));
};

export const deleteImage = (imageId: number) => call(() => api.deleteImage.productDeleteImage({ imageId }, { format: "json" }));

export type ApprovalStatus = "Approved" | "Pending" | "Rejected";

export const getPendingProducts = () =>
  call(() => api.getPendingProducts.productGetPendingProducts()).then(list => list.map(toProduct));

export const setProductApproval = (productId: number, status: ApprovalStatus) =>
  call(() => api.setProductApproval.productSetProductApproval({ productId, status })).then(toProduct);

export const createCategory = (name: string) =>
  call(() => api.createCategory.categoryCreateCategory({ name })).then(toCategory);

export const updateCategory = (id: number, name: string) =>
  call(() => api.updateCategory.categoryUpdateCategory({ name }, { id })).then(toCategory);

export const deleteCategory = (id: number) => call(() => api.deleteCategory.categoryDeleteCategory({ id }, { format: "json" }));

export const getAllProducts = () =>
    call(() => api.getAllProducts.productGetAllProducts()).then(list => list.map(toProduct));

export const setProductActive = (id: number, isActive: boolean) =>
    call(() => api.setProductActive.productSetProductActive({ id, isActive })).then(toProduct);

export const updateStock = (id: number, stock: number) =>
    call(() => api.updateStock.productUpdateStock({ id, stock })).then(toProduct);
