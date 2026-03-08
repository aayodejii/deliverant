import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { github } from "@/lib/oauth";
import { setSession } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:8000/v1";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET!;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!code || !state || state !== storedState) {
    return Response.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return Response.redirect(new URL("/login?error=failed_to_fetch_user", request.url));
    }

    const githubUser = await userRes.json();

    let email = githubUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified);
        email = primary?.email;
      }
    }

    if (!email) {
      return Response.redirect(new URL("/login?error=no_email", request.url));
    }

    const provisionRes = await fetch(`${API_BASE}/auth/oauth-provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        email,
        name: githubUser.name || githubUser.login,
        provider: "github",
        provider_account_id: String(githubUser.id),
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
