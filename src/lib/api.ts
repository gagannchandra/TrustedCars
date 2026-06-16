import { config } from "./config";

/** Normalised API error thrown for any non-2xx response. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Request timeout in milliseconds. Defaults to 15s. */
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Override the JSON content type (e.g. for FormData). */
  contentType?: string;
};

function buildUrl(path: string, query?: Query): string {
  const base = config.apiUrl.endsWith("/")
    ? config.apiUrl.slice(0, -1)
    : config.apiUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${cleanPath}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

const DEFAULT_TIMEOUT = 15_000;

/** Core fetch wrapper with timeout, JSON handling and uniform errors. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    timeoutMs = DEFAULT_TIMEOUT,
    signal,
    contentType = "application/json",
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Compose external abort signal with our timeout signal.
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
    // Let the browser set the multipart boundary.
  } else if (body !== undefined) {
    headers["Content-Type"] = contentType;
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, "TIMEOUT", "The request took too long. Please retry.");
    }
    throw new ApiError(0, "NETWORK", "Unable to reach the server. Check your connection.");
  }
  clearTimeout(timer);

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && (data as any).error?.message) ||
      response.statusText ||
      "Something went wrong";
    const code =
      (data && typeof data === "object" && "error" in data && (data as any).error?.code) ||
      "HTTP_ERROR";
    throw new ApiError(response.status, code, message, data);
  }

  // Unwrap the conventional { success, data } envelope.
  if (data && typeof data === "object" && "success" in data && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

/** Convenience verb helpers for ergonomic call sites. */
export const api = {
  get: <T>(path: string, query?: Query, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET", query }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};

/** Read a human-friendly message from any thrown value. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
