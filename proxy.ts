import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/journey(.*)",
  "/mentorship(.*)",
  "/journal(.*)",
  "/settings(.*)",
  "/pad-her-power(.*)",
  "/safety(.*)",
  "/school(.*)",
  "/onboarding(.*)",
  "/mentor-portal(.*)",
  "/parent-portal(.*)",
  "/activities(.*)",
  "/admin((?!/sign-in).*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const rawHost = request.headers.get("host") ?? "";
  const hostname = rawHost.split(":")[0]; // strip port
  const isAdminSubdomain =
    hostname === (process.env.ADMIN_HOSTNAME ?? "admin.ikigai.app");
  const isAppSubdomain =
    hostname === (process.env.APP_HOSTNAME ?? "app.ikigai.app");
  const pathname = request.nextUrl.pathname;

  // --- admin.ikigai.app ---
  if (isAdminSubdomain) {
    if (pathname.startsWith("/sign-up")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
    if (
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/sso-callback") &&
      !pathname.startsWith("/api/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // --- app.ikigai.app ---
  if (isAppSubdomain) {
    if (pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      const adminHost = process.env.ADMIN_HOSTNAME ?? "admin.ikigai.app";
      url.hostname = adminHost;
      return NextResponse.redirect(url);
    }
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // --- ikigai.app (marketing) ---
  // Block PWA-only paths — redirect them to the app subdomain
  const appHost = process.env.APP_HOSTNAME ?? "app.ikigai.app";
  const PWA_PATHS = [
    "/dashboard",
    "/journal",
    "/journey",
    "/mentorship",
    "/pad-her-power",
    "/safety",
    "/school",
    "/settings",
    "/onboarding",
    "/mentor-portal",
    "/parent-portal",
    "/activities",
    "/sign-in",
    "/sign-up",
    "/install",
  ];
  if (PWA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.hostname = appHost;
    return NextResponse.redirect(url);
  }
  // All other paths (/, /how-it-works, /about, /contact, /privacy, /terms, /api/) pass through
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
