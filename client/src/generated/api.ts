/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface UserDto {
  userId?: string;
  username?: string;
  role?: string;
  isActive?: boolean;
}

export interface RegisterRequestDto {
  username?: string;
  password?: string;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export interface LoginRequestDto {
  username?: string;
  password?: string;
}

export interface CategoryResponseDTO {
  /** @format int32 */
  id?: number;
  name?: string;
}

export interface CategoryRequestDTO {
  name?: string;
}

export interface OrderResponseDTO {
  /** @format int32 */
  id?: number;
  customerId?: string;
  /** @format date-time */
  purchasedAtUtc?: string;
  products?: OrderProductResponseDTO[];
}

export interface OrderProductResponseDTO {
  /** @format int32 */
  productId?: number;
  productTitle?: string;
  /** @format int32 */
  quantity?: number;
  vendorId?: string;
}

export interface OrderRequestDTO {
  customerId?: string;
  products?: OrderProductRequestDTO[];
}

export interface OrderProductRequestDTO {
  /** @format int32 */
  productid?: number;
  /** @format int32 */
  quantity?: number;
}

export interface ProductResponseDTO {
  /** @format int32 */
  id?: number;
  title?: string;
  /** @format decimal */
  price?: number;
  description?: string;
  /** @format int32 */
  stock?: number;
  /** @format int32 */
  categoryId?: number;
  vendorId?: string;
  status?: string;
  isActive?: boolean;
  images?: ProductImageDTO[];
}

export interface ProductImageDTO {
  /** @format int32 */
  id?: number;
  isPrimary?: boolean;
  /** @format int32 */
  sortOrder?: number;
  extension?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "http://localhost:5120";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data.data;
    });
  };
}

/**
 * @title My Title
 * @version 1.0.0
 * @baseUrl http://localhost:5120
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  register = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthRegister
     * @request POST:/Register
     */
    authRegister: (data: RegisterRequestDto, params: RequestParams = {}) =>
      this.request<UserDto, any>({
        path: `/Register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  login = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthLogin
     * @request POST:/Login
     */
    authLogin: (data: LoginRequestDto, params: RequestParams = {}) =>
      this.request<any, ProblemDetails>({
        path: `/Login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  getMe = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthGetMe
     * @request GET:/GetMe
     * @secure
     */
    authGetMe: (params: RequestParams = {}) =>
      this.request<UserDto, any>({
        path: `/GetMe`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  adminCheck = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthAdminCheck
     * @request GET:/AdminCheck
     * @secure
     */
    authAdminCheck: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/AdminCheck`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  getCategories = {
    /**
     * No description
     *
     * @tags Category
     * @name CategoryGetCategories
     * @request GET:/GetCategories
     * @secure
     */
    categoryGetCategories: (params: RequestParams = {}) =>
      this.request<CategoryResponseDTO[], any>({
        path: `/GetCategories`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  getCategory = {
    /**
     * No description
     *
     * @tags Category
     * @name CategoryGetCategory
     * @request GET:/GetCategory
     * @secure
     */
    categoryGetCategory: (
      query?: {
        /** @format int32 */
        id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<CategoryResponseDTO, any>({
        path: `/GetCategory`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  createCategory = {
    /**
     * No description
     *
     * @tags Category
     * @name CategoryCreateCategory
     * @request POST:/CreateCategory
     * @secure
     */
    categoryCreateCategory: (
      data: CategoryRequestDTO,
      params: RequestParams = {},
    ) =>
      this.request<CategoryResponseDTO, any>({
        path: `/CreateCategory`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  updateCategory = {
    /**
     * No description
     *
     * @tags Category
     * @name CategoryUpdateCategory
     * @request PUT:/UpdateCategory
     * @secure
     */
    categoryUpdateCategory: (
      data: CategoryRequestDTO,
      query?: {
        /** @format int32 */
        id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<CategoryResponseDTO, any>({
        path: `/UpdateCategory`,
        method: "PUT",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  deleteCategory = {
    /**
     * No description
     *
     * @tags Category
     * @name CategoryDeleteCategory
     * @request DELETE:/DeleteCategory
     * @secure
     */
    categoryDeleteCategory: (
      query?: {
        /** @format int32 */
        id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Blob, any>({
        path: `/DeleteCategory`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),
  };
  getOrders = {
    /**
     * No description
     *
     * @tags Order
     * @name OrderGetOrders
     * @request GET:/GetOrders
     * @secure
     */
    orderGetOrders: (params: RequestParams = {}) =>
      this.request<OrderResponseDTO[], any>({
        path: `/GetOrders`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  getOrder = {
    /**
     * No description
     *
     * @tags Order
     * @name OrderGetOrder
     * @request GET:/GetOrder
     * @secure
     */
    orderGetOrder: (
      query?: {
        /** @format int32 */
        orderId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<OrderResponseDTO, any>({
        path: `/GetOrder`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  placeOrder = {
    /**
     * No description
     *
     * @tags Order
     * @name OrderPlaceOrder
     * @request POST:/PlaceOrder
     * @secure
     */
    orderPlaceOrder: (data: OrderRequestDTO, params: RequestParams = {}) =>
      this.request<OrderResponseDTO, any>({
        path: `/PlaceOrder`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  getProducts = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProducts
     * @request GET:/GetProducts
     * @secure
     */
    productGetProducts: (params: RequestParams = {}) =>
      this.request<ProductResponseDTO[], any>({
        path: `/GetProducts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  getMyProducts = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductGetMyProducts
     * @request GET:/GetMyProducts
     * @secure
     */
    productGetMyProducts: (params: RequestParams = {}) =>
      this.request<ProductResponseDTO[], any>({
        path: `/GetMyProducts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  getPendingProducts = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductGetPendingProducts
     * @request GET:/GetPendingProducts
     * @secure
     */
    productGetPendingProducts: (params: RequestParams = {}) =>
      this.request<ProductResponseDTO[], any>({
        path: `/GetPendingProducts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  getProduct = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProduct
     * @request GET:/GetProduct
     * @secure
     */
    productGetProduct: (
      query?: {
        /** @format int32 */
        id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ProductResponseDTO, any>({
        path: `/GetProduct`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  searchProducts = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductSearchProducts
     * @request GET:/SearchProducts
     * @secure
     */
    productSearchProducts: (
      query?: {
        search?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ProductResponseDTO[], any>({
        path: `/SearchProducts`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  createProduct = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductCreateProduct
     * @request POST:/CreateProduct
     * @secure
     */
    productCreateProduct: (
      data: {
        Title?: string | null;
        Description?: string | null;
        /** @format decimal */
        Price?: number;
        /** @format int32 */
        Stock?: number;
        /** @format int32 */
        CategoryId?: number;
        VendorId?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<ProductResponseDTO, any>({
        path: `/CreateProduct`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  updateProduct = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductUpdateProduct
     * @request PUT:/UpdateProduct
     * @secure
     */
    productUpdateProduct: (
      data: {
        Title?: string | null;
        Description?: string | null;
        /** @format decimal */
        Price?: number;
        /** @format int32 */
        Stock?: number;
        /** @format int32 */
        CategoryId?: number;
        VendorId?: string | null;
      },
      query?: {
        /** @format int32 */
        id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ProductResponseDTO, any>({
        path: `/UpdateProduct`,
        method: "PUT",
        query: query,
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  setProductApproval = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductSetProductApproval
     * @request PUT:/SetProductApproval
     * @secure
     */
    productSetProductApproval: (
      query?: {
        /** @format int32 */
        productId?: number;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ProductResponseDTO, any>({
        path: `/SetProductApproval`,
        method: "PUT",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  deleteProduct = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductDeleteProduct
     * @request DELETE:/DeleteProduct
     * @secure
     */
    productDeleteProduct: (
      query?: {
        /** @format int32 */
        id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Blob, any>({
        path: `/DeleteProduct`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),
  };
  getImage = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductGetImage
     * @request GET:/GetImage
     * @secure
     */
    productGetImage: (
      query?: {
        /** @format int32 */
        imageId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Blob, any>({
        path: `/GetImage`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),
  };
  uploadImages = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductUploadImages
     * @request POST:/UploadImages
     * @secure
     */
    productUploadImages: (
      data: {
        files?: File[] | null;
      },
      query?: {
        /** @format int32 */
        productId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ProductImageDTO[], any>({
        path: `/UploadImages`,
        method: "POST",
        query: query,
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  deleteImage = {
    /**
     * No description
     *
     * @tags Product
     * @name ProductDeleteImage
     * @request DELETE:/DeleteImage
     * @secure
     */
    productDeleteImage: (
      query?: {
        /** @format int32 */
        imageId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Blob, any>({
        path: `/DeleteImage`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),
  };
}
