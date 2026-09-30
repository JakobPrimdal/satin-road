import { Api, ContentType, type HttpResponse, type RegisterRequestDto, type UserDto } from "@/generated/api";

export const API_URL = envApiUrl() || "http://localhost:5120";

function envApiUrl(): string | undefined {
  try {
    return process.env.BUN_PUBLIC_API_URL;
  } catch {
    return undefined;
  }
}

const api = new Api({ baseUrl: API_URL });

export type User = UserDto;
export type Credentials = RegisterRequestDto;

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

interface ProblemDetails {
  title?: string;
}

function toApiError(res: HttpResponse<unknown, ProblemDetails | null>): ApiError {
  const message =
    res.status === 404
      ? "The requested resource was not found."
      : res.status >= 500
        ? "Something went wrong on the server."
        : (res.error?.title ?? `Request failed (${res.status})`);
  return new ApiError(message, res.status);
}

export const register = (credentials: Credentials) => call(() => api.register.authRegister(credentials));

export const login = (credentials: Credentials) =>
  call(() =>
    api.request<User>({
      path: "/Login",
      method: "POST",
      body: credentials,
      type: ContentType.Json,
      format: "json",
    }),
  );
