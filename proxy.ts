import { clerkMiddleware } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";

// Look up a user's role from our database by their Clerk id. Cached briefly so
// we don't hit the database on every admin request.
const roleCache = new Map<string, { role: string | null; expires: number }>();
const ROLE_CACHE_TTL = 60 * 1000; // 1 minute

async function getUserRole(clerkId: string): Promise<string | null> {
  const cached = roleCache.get(clerkId);
  if (cached && cached.expires > Date.now()) {
    return cached.role;
  }

  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    const role = user?.role ?? null;
    roleCache.set(clerkId, { role, expires: Date.now() + ROLE_CACHE_TTL });
    return role;
  } catch (error) {
    console.error("proxy: failed to fetch user role", error);
    return null;
  }
}

// Paths that belong to the PWA (the app subdomain). On the marketing domain
// these are redirected to the app subdomain; everything else is marketing.
const PWA_PATHS = [
  "/dashboard",
  "/journal",
  "/journey",
  "/mentorship",
  "/pad-her-power",
  "/safety",
  "/settings",
  "/onboarding",
  "/mentor-portal",
  "/parent-portal",
  "/activities",
  "/sign-in",
  "/sign-up",
];

const isPwaPath = (pathname: string) =>
  PWA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const isAdminPath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

// Compare against the hostname only — the request host header includes the port
// in local dev (e.g. "app.localhost:3000") but the env var may or may not.
const hostnameOf = (value: string) => value.split(":")[0];

/**
 * Subdomain routing only. This proxy never touches authentication, roles, or
 * the database — those checks live in the route-group layouts:
 *   - app/(pwa)/(app)/layout.tsx       → PWA auth + onboarding gate
 *   - app/admin/(protected)/layout.tsx → admin auth + role gate
 * Keeping the proxy free of auth/DB logic is what prevents redirect loops.
 *
 * Authentication for the admin subdomain is enforced here: the Clerk session
 * gives us the user id, which we look up in our database to read `user.role`.
 * Non-admins never reach an admin page.
 *
 *   admin.<domain>  → the /admin tree   (URLs shown without the /admin prefix)
 *   app.<domain>    → the PWA
 *   <domain>        → marketing
 */
export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const hostname = hostnameOf(request.headers.get("host") ?? "");

  const rawAppHost = env.appHostname;
  const rawAdminHost = env.adminHostname;

  const isAdmin = hostname === hostnameOf(rawAdminHost);
  const isApp = hostname === hostnameOf(rawAppHost);

  // --- ADMIN SUBDOMAIN ---------------------------------------------------
  if (isAdmin) {
    // No self-service sign-up for admins.
    if (pathname === "/sign-up" || pathname.startsWith("/sign-up/")) {
      const signIn = url.clone();
      signIn.pathname = "/sign-in";
      return NextResponse.redirect(signIn);
    }

    // The login page and Clerk's own callbacks must stay public — gating them
    // would create a redirect loop. They still get rewritten into /admin below.
    const isAuthPath =
      pathname === "/sign-in" ||
      pathname.startsWith("/sign-in/") ||
      pathname.startsWith("/sso-callback");

    // Everything else on the admin subdomain requires an admin account.
    if (!isAuthPath && !pathname.startsWith("/api/")) {
      const { userId, redirectToSignIn } = await auth();

      // Not signed in → hand off to Clerk's sign-in redirect. Using Clerk's
      // own helper (rather than a manual redirect) lets it run the session
      // handshake on this subdomain; a manual redirect would skip the
      // handshake and bounce forever between /sign-in and the app.
      if (!userId) {
        return redirectToSignIn({ returnBackUrl: request.url });
      }

      // Signed in but not an admin → render a terminal "not authorized" page
      // ON this domain via a rewrite (not a redirect). A cross-domain redirect
      // here can ping-pong with Clerk's session handshake and trigger
      // ERR_TOO_MANY_REDIRECTS, since the session cookie may live on a
      // different subdomain. A rewrite renders in place and cannot loop.
      const role = await getUserRole(userId);
      if (role !== "admin") {
        const denied = url.clone();
        denied.pathname = "/admin/unauthorized";
        return NextResponse.rewrite(denied);
      }
    }

    // Already-prefixed paths and API routes pass through unchanged.
    if (isAdminPath(pathname) || pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Map clean URLs into the /admin tree: "/" → "/admin", "/x" → "/admin/x".
    // The /admin prefix is never shown in the address bar.
    const rewritten = url.clone();
    rewritten.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    return NextResponse.rewrite(rewritten);
  }

  // --- APP SUBDOMAIN -----------------------------------------------------
  if (isApp) {
    // /admin belongs on the admin subdomain.
    if (isAdminPath(pathname)) {
      const adminUrl = url.clone();
      adminUrl.host = rawAdminHost;
      return NextResponse.redirect(adminUrl);
    }

    // The PWA has no landing page at "/" — send it to the dashboard, which
    // gates on auth/onboarding downstream.
    if (pathname === "/") {
      const dashboard = url.clone();
      dashboard.pathname = "/dashboard";
      return NextResponse.redirect(dashboard);
    }

    return NextResponse.next();
  }

  // --- MARKETING DOMAIN --------------------------------------------------
  // PWA-only paths belong on the app subdomain.
  if (isPwaPath(pathname)) {
    const appUrl = url.clone();
    appUrl.host = rawAppHost;
    return NextResponse.redirect(appUrl);
  }

  // /admin belongs on the admin subdomain.
  if (isAdminPath(pathname)) {
    const adminUrl = url.clone();
    adminUrl.host = rawAdminHost;
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
