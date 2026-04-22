import { useAuthStore } from "@/stores/authStore";

import { API_BASE } from "./env";

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(params: { status: number; code: string; message: string; details?: unknown }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

function joinUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_BASE;
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {}
): Promise<T> {
  const { accessToken: tokenOverride, headers: hdrs, ...rest } = options;
  const headers = new Headers(hdrs);

  const applyAuth = (token: string | null | undefined) => {
    if (token) headers.set("Authorization", `Bearer ${token}`);
  };

  let token = tokenOverride ?? useAuthStore.getState().accessToken;
  applyAuth(token);

  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const doFetch = () =>
    fetch(joinUrl(path), { ...rest, headers, credentials: "include" });

  let res = await doFetch();

  const isRefreshEndpoint = path.replace(/\/$/, "") === "/api/auth/refresh";

  if (res.status === 401 && !tokenOverride && !isRefreshEndpoint) {
    const rt = useAuthStore.getState().refreshToken;
    if (rt) {
      try {
        const refreshRes = await fetch(joinUrl("/api/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
          credentials: "include",
        });
        const data = (await refreshRes.json()) as {
          user?: {
            id: string;
            name: string;
            email: string;
            createdAt: string;
          };
          accessToken?: string;
          refreshToken?: string;
        };
        if (
          !refreshRes.ok ||
          !data.accessToken ||
          !data.refreshToken ||
          !data.user
        ) {
          useAuthStore.getState().logout();
        } else {
          useAuthStore.getState().setSession({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          token = data.accessToken;
          headers.set("Authorization", `Bearer ${token}`);
          res = await doFetch();
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? ((await res.json()) as unknown) : undefined;

  if (!res.ok) {
    const err = body as ApiErrorBody | undefined;
    const message = err?.error?.message ?? res.statusText;
    const code = err?.error?.code ?? "HTTP_ERROR";
    const details = err?.error?.details;
    throw new ApiError({ status: res.status, code, message, details });
  }

  return body as T;
}
