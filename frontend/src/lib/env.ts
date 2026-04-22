const raw = import.meta.env.VITE_API_URL as string | undefined;

/** Base URL for REST API (no trailing slash). Empty = same-origin (Vite proxy to backend in dev). */
export const API_BASE = (raw?.replace(/\/$/, "") ?? "").trim() || "";

/** Where Socket.IO connects. Defaults to local backend in dev. */
export const SOCKET_ORIGIN =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.replace(/\/$/, "") ||
  (import.meta.env.DEV
    ? "http://localhost:8080"
    : typeof window !== "undefined"
      ? window.location.origin
      : "");
