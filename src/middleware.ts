import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isAdminLoginRequest(req: NextRequest) {
  return req.nextUrl.pathname === "/admin/login";
}

function isAdminProtectedRequest(req: NextRequest) {
  return req.nextUrl.pathname.startsWith("/admin") && !isAdminLoginRequest(req);
}

function isUserProtectedRequest(req: NextRequest) {
  const p = req.nextUrl.pathname;
  return (
    p.startsWith("/dashboard") ||
    p.startsWith("/interview") ||
    p.startsWith("/chat") ||
    p.startsWith("/voice") ||
    p.startsWith("/practice") ||
    p.startsWith("/interview-summary") ||
    p.startsWith("/interview-results")
  );
}

function isUserAuthRequest(req: NextRequest) {
  const p = req.nextUrl.pathname;
  return p === "/login" || p === "/signup";
}

export function middleware(req: NextRequest) {
  const role = req.cookies.get("role")?.value?.toLowerCase();
  const token = req.cookies.get("access_token")?.value;
  const isAuthenticated = Boolean(token);
  const isAdmin = isAuthenticated && role === "admin";
  const isCandidate =
    isAuthenticated &&
    (role === "user" || role === "candidate" || role === "student" || role === "employed");

  // 1. /admin/login route
  if (isAdminLoginRequest(req)) {
    // If already authenticated as ADMIN, redirect to /admin/dashboard
    if (isAdmin) {
      const targetUrl = req.nextUrl.clone();
      targetUrl.pathname = "/admin/dashboard";
      targetUrl.search = "";
      return NextResponse.redirect(targetUrl);
    }
    // Allow unauthenticated users or candidates to view /admin/login
    return NextResponse.next();
  }

  // 2. Protected /admin/** routes (excluding /admin/login)
  if (isAdminProtectedRequest(req)) {
    if (isAdmin) return NextResponse.next();

    // If authenticated as non-admin Candidate/User, redirect to user dashboard
    if (isCandidate) {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    // Unauthenticated -> redirect to /admin/login with next param
    const adminLoginUrl = req.nextUrl.clone();
    adminLoginUrl.pathname = "/admin/login";
    adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(adminLoginUrl);
  }

  // 3. User /login or /signup routes
  if (isUserAuthRequest(req)) {
    if (isAdmin) {
      const adminUrl = req.nextUrl.clone();
      adminUrl.pathname = "/admin/dashboard";
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }
    if (isCandidate) {
      const userUrl = req.nextUrl.clone();
      userUrl.pathname = "/dashboard";
      userUrl.search = "";
      return NextResponse.redirect(userUrl);
    }
    return NextResponse.next();
  }

  // 4. Candidate protected routes (/dashboard, /interview, etc.)
  if (isUserProtectedRequest(req)) {
    if (isAuthenticated) return NextResponse.next();

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
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
    "/interview-results",
    "/interview-results/:path*",
  ],
};
