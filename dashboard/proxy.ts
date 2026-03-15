import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";

  if (pathname === "/login") {
    return isWaitlistMode
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  const sessionCookie = request.cookies.get("deliverant_session");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!$|api/auth|api/waitlist|docs|img|_next/static|_next/image|favicon.ico).*)",
  ],
};
