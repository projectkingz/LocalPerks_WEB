import { NextRequest, NextResponse } from "next/server";
// Temporarily disable API JWT verification in Edge middleware.
// We'll verify JWT inside API route handlers (Node runtime) instead.
// import { getBearerToken, verifyMobileJwt } from "@/lib/auth/mobile";
import { getToken } from "next-auth/jwt";

// One unified middleware for API (mobile) and app routes (web)
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Do not guard API routes here
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2) Protect app routes with next-auth session (role checks)
  const token: any = await getToken({ req });
  if (!token) {
    return NextResponse.next(); // or redirect to signin if desired
  }

  // Role-based access control for app routes
  if (pathname.startsWith("/admin")) {
    if (!["ADMIN", "SUPER_ADMIN"].includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  if (pathname.startsWith("/partner")) {
    if (token.role !== "PARTNER")
      return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/customer")) {
    if (token.role !== "CUSTOMER")
      return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// export const config = {
//   matcher: ['/api/:path*', '/admin/:path*', '/partner/:path*', '/customer/:path*'],
// };

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*", "/customer/:path*"],
};
