import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// One unified middleware for API (mobile) and app routes (web)
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) CSRF origin check for browser-based API mutation requests.
  //    Mobile clients use Bearer tokens and are not vulnerable to CSRF,
  //    so they are exempted. Only requests with a cross-site Origin are blocked.
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)
  ) {
    const hasBearerToken = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasBearerToken) {
      const origin = req.headers.get("origin");
      if (origin) {
        const host = req.headers.get("host") || "";
        const appUrl = process.env.NEXTAUTH_URL || "";
        const allowedHosts = [
          host,
          appUrl ? new URL(appUrl).host : "",
        ].filter(Boolean);
        try {
          const originHost = new URL(origin).host;
          if (!allowedHosts.includes(originHost)) {
            return new NextResponse(
              JSON.stringify({ error: "CSRF check failed: request origin not allowed" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch {
          // Malformed Origin header — reject
          return new NextResponse(
            JSON.stringify({ error: "CSRF check failed: invalid origin" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
    return NextResponse.next();
  }

  // 2) Protect app routes with next-auth session (role checks)
  const token: any = await getToken({ req });
  if (!token) {
    return NextResponse.next();
  }

  // 3) Block suspended users from accessing protected pages
  if (token.suspended) {
    const signinUrl = new URL("/auth/signin", req.url);
    signinUrl.searchParams.set("error", "ACCOUNT_SUSPENDED");
    return NextResponse.redirect(signinUrl);
  }

  // Role-based access control for app routes
  if (pathname.startsWith("/admin")) {
    if (!["ADMIN", "SUPER_ADMIN"].includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  // Only protect partner dashboard routes, not the public partner landing page
  if (
    pathname.startsWith("/partner/dashboard") ||
    pathname.startsWith("/partner/pending-approvals") ||
    pathname.startsWith("/partner/profile") ||
    pathname.startsWith("/partner/vouchers") ||
    pathname.startsWith("/partner/transactions")
  ) {
    if (token.role !== "PARTNER")
      return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/customer")) {
    if (token.role !== "CUSTOMER")
      return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/partner/dashboard/:path*",
    "/partner/pending-approvals/:path*",
    "/partner/profile/:path*",
    "/partner/vouchers/:path*",
    "/partner/transactions/:path*",
    "/customer/:path*",
  ],
};
