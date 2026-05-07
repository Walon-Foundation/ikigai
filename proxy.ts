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
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const hostname = request.headers.get("host") ?? "";
  const isAdminSubdomain = hostname.startsWith("admin.");

  if (isAdminSubdomain && !request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname =
      url.pathname === "/" ? "/admin" : `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
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
