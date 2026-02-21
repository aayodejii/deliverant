import { cookies } from "next/headers";

const COOKIE_NAME = "deliverant_session";
const API_BASE = process.env.API_URL || "http://localhost:8000/v1";

export async function getApiKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setSession(apiKey: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function proxyToApi(path: string, init?: RequestInit) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
