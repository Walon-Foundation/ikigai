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
  "/admin((?!/sign-in).*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const hostname = request.headers.get("host") ?? "";
  const isAdminSubdomain = hostname.startsWith("admin.");
  const pathname = request.nextUrl.pathname;

  if (isAdminSubdomain) {
    // Block sign-up on admin subdomain — redirect to sign-in
    if (pathname.startsWith("/sign-up")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }

    // Rewrite all non-admin-prefixed paths to /admin/*
    // Includes /sign-in → /admin/sign-in (so admin gets its own sign-in page)
    if (
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/sso-callback")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
