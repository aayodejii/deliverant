import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { google } from "@/lib/oauth";
import { setSession } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:8000/v1";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET!;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;
  cookieStore.delete("oauth_state");
  cookieStore.delete("oauth_code_verifier");

  if (!code || !state || state !== storedState || !codeVerifier) {
    return Response.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return Response.redirect(new URL("/login?error=failed_to_fetch_user", request.url));
    }

    const googleUser = await userRes.json();

    const provisionRes = await fetch(`${API_BASE}/auth/oauth-provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        email: googleUser.email,
        name: googleUser.name || "",
        provider: "google",
        provider_account_id: googleUser.id,
      }),
    });

    if (!provisionRes.ok) {
      return Response.redirect(new URL("/login?error=provision_failed", request.url));
    }

    const { api_key } = await provisionRes.json();
    await setSession(api_key);

    return Response.redirect(new URL("/dashboard", request.url));
  } catch {
    return Response.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
