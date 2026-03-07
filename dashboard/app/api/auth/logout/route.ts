import { getApiKey, clearSession } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:8000/v1";

export async function POST() {
  const apiKey = await getApiKey();

  if (apiKey) {
    await fetch(`${API_BASE}/auth/revoke-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }).catch(() => {});
  }

  await clearSession();
  return Response.json({ ok: true });
}
