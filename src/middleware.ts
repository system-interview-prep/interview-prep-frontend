import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isAdminRequest(req: NextRequest) {
  return req.nextUrl.pathname.startsWith("/admin");
}

function isUserProtectedRequest(req: NextRequest) {
  const p = req.nextUrl.pathname;
  return (
    p.startsWith("/dashboard") ||
    p.startsWith("/interview") ||
    p.startsWith("/chat") ||
    p.startsWith("/voice") ||
    p.startsWith("/practice") ||
    p.startsWith("/interview-summary")
  );
}

export function middleware(req: NextRequest) {
  const role = req.cookies.get("role")?.value?.toLowerCase();
  const token = req.cookies.get("access_token")?.value;

  if (isAdminRequest(req)) {
    if (role === "admin") return NextResponse.next();
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isUserProtectedRequest(req)) {
    // Basic verification: user has a valid access_token
    if (token) return NextResponse.next();
    
    // Explicit Role verification fallback
    if (role === "user" || role === "candidate" || role === "student" || role === "employed") {
      return NextResponse.next();
    }
    
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/interview/:path*",
    "/chat/:path*",
    "/voice",
    "/voice/:path*",
    "/practice",
    "/practice/:path*",
    "/interview-summary",
    "/interview-summary/:path*",
  ],
};

