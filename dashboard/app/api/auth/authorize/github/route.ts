import { cookies } from "next/headers";
import { generateState } from "arctic";
import { github } from "@/lib/oauth";

export async function GET() {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["user:email"]);

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return Response.redirect(url.toString());
}
