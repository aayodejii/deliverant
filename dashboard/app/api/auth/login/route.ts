import { NextRequest } from "next/server";
import { setSession } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:8000/v1";

export async function POST(request: NextRequest) {
  const { api_key } = await request.json();

  if (!api_key) {
    return Response.json({ error: "API key is required" }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/endpoints`, {
    headers: { Authorization: `Bearer ${api_key}` },
  });

  if (!res.ok) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  await setSession(api_key);
  return Response.json({ ok: true });
}
