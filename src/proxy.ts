import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  const isLoggedIn = !!token;
  const isAuthRoute =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup");

  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup"],
};