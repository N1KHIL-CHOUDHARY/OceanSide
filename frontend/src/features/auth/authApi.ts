import type { User } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";

export async function registerRequest(body: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function loginRequest(body: {
  email: string;
  password: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function refreshRequest(refreshToken: string): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
}> {
  return apiFetch("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
