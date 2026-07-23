"use client";

import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // Silent warning in dev; the UI will surface friendly errors.
  // eslint-disable-next-line no-console
  console.warn(
    "[api] NEXT_PUBLIC_API_URL não definida. Defina no .env do frontend."
  );
}

export const TOKEN_KEY = "checkout_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { body, auth = true, headers, ...rest } = options;
  let method = options.method ?? "GET";

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  // FormData — let the browser set the multipart boundary
  // PHP/Laravel does not parse multipart bodies for PUT/PATCH, so spoof the method via POST.
  let isFormData = body instanceof FormData;
  if (isFormData && method !== "GET" && method !== "POST") {
    const fd = body as FormData;
    if (!fd.has("_method")) {
      fd.append("_method", method);
    }
    method = "POST";
  }

  if (body !== undefined && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    method,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (res.status === 401 && typeof window !== "undefined") {
    setToken(null);
    // Avoid redirect loops when already on an auth route
    if (!window.location.pathname.startsWith("/auth")) {
      window.location.href = "/";
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message)
        : null) ?? `Erro ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  // Some endpoints return no content
  if (res.status === 204 || data === null) return undefined as T;
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
  raw: () => API_URL ?? "",
};

/** Helper for routes that don't belong under /api (e.g. shopify oauth). */
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

// referenced to keep useRouter import meaningful for future guard utilities
export { useRouter };
