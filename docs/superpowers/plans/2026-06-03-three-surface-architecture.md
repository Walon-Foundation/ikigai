# Three-Surface Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single Next.js app into three surfaces — `ikigai.app` (marketing), `app.ikigai.app` (PWA-only), `admin.ikigai.app` (admin) — served from one codebase via hostname-based middleware routing.

**Architecture:** Middleware detects hostname and enforces surface boundaries. Route groups `(marketing)` and `(pwa)` separate the layouts. `ClerkProvider` moves from the root layout into `(pwa)/layout.tsx` and a new `admin/layout.tsx`. A `PwaGate` client component enforces standalone-only access inside the PWA surface.

**Tech Stack:** Next.js 16, Clerk v7, TypeScript, Tailwind CSS 4

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Modify | `app/layout.tsx` | Remove ClerkProvider + SW script — fonts only |
| Create | `app/(marketing)/layout.tsx` | Plain layout for ikigai.app |
| Move | `app/page.tsx` → `app/(marketing)/page.tsx` | Marketing home |
| Create | `app/(pwa)/layout.tsx` | ClerkProvider + SW registration for app.ikigai.app |
| Move | `app/(auth)/layout.tsx` → `app/(pwa)/(auth)/layout.tsx` | Auth surface under pwa |
| Move | `app/(auth)/sign-in/...` → `app/(pwa)/(auth)/sign-in/...` | |
| Move | `app/(auth)/sign-up/...` → `app/(pwa)/(auth)/sign-up/...` | |
| Move | `app/(app)/layout.tsx` → `app/(pwa)/(app)/layout.tsx` | App shell under pwa |
| Move | `app/(app)/**` → `app/(pwa)/(app)/**` | All app routes |
| Move | `app/onboarding/**` → `app/(pwa)/onboarding/**` | Onboarding under pwa |
| Create | `app/(pwa)/install/page.tsx` | Install instructions page |
| Create | `app/admin/layout.tsx` | ClerkProvider for admin surface |
| Create | `components/pwa-gate.tsx` | Client component — standalone check |
| Modify | `app/(pwa)/(app)/layout.tsx` | Add PwaGate, remove PwaInstallPrompt |
| Modify | `proxy.ts` | Extend middleware for all three surfaces |
| Modify | `app/manifest.ts` | start_url → `/dashboard` (already correct, scope clarification) |

---

## Task 1: Strip the root layout

**Files:**
- Modify: `app/layout.tsx`

The root layout currently provides `ClerkProvider` for the whole app and registers the service worker. Both move to surface-specific layouts. After this task, `app/layout.tsx` is fonts + globals only.

- [ ] **Step 1: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ikigai — Find your reason to wake up every morning",
  description:
    "Ikigai connects youth in Sierra Leone with mentors, growth tools, and a community built for their future.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ikigai",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1A5C3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the file looks right**

```bash
head -5 app/layout.tsx
```
Expected: first import is `next/font/google`, no `@clerk/nextjs` import.

---

## Task 2: Create the (marketing) route group

**Files:**
- Create: `app/(marketing)/layout.tsx`
- Move: `app/page.tsx` → `app/(marketing)/page.tsx`

The marketing surface has no Clerk, no auth check. The home page already has all the right content — we just move it and remove the `auth()` import and redirect.

- [ ] **Step 1: Create `app/(marketing)/layout.tsx`**

```tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Move `app/page.tsx` into the marketing group**

```bash
mkdir -p app/\(marketing\)
git mv app/page.tsx app/\(marketing\)/page.tsx
```

- [ ] **Step 3: Remove auth import and redirect from `app/(marketing)/page.tsx`**

Remove these lines from the top of the file:
```ts
import { auth } from "@clerk/nextjs/server";
```
And remove this block inside `Home()`:
```ts
const { userId } = await auth();
if (userId) redirect("/dashboard");
```
Also remove `redirect` from the `next/navigation` import.

The `Home` function signature after cleanup:
```tsx
export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      // ... rest unchanged
    </div>
  );
}
```

- [ ] **Step 4: Verify no Clerk/auth imports remain in `app/(marketing)/page.tsx`**

```bash
grep -n "clerk\|auth\|redirect" app/\(marketing\)/page.tsx
```
Expected: no output (or only non-auth `redirect` from `lucide-react` if any — but there are none).

---

## Task 3: Create the (pwa) route group layout

**Files:**
- Create: `app/(pwa)/layout.tsx`

This layout wraps all PWA routes with `ClerkProvider` and registers the service worker. It is only rendered when the user is on `app.ikigai.app`.

- [ ] **Step 1: Create `app/(pwa)/layout.tsx`**

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function PwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}))}`,
        }}
      />
    </ClerkProvider>
  );
}
```

---

## Task 4: Move auth routes under (pwa)

**Files:**
- Move: `app/(auth)/` → `app/(pwa)/(auth)/`

Route groups are URL-transparent. Moving `(auth)` inside `(pwa)` keeps `/sign-in` and `/sign-up` as the URLs — nothing changes for Clerk's redirect URLs.

- [ ] **Step 1: Move the auth route group**

```bash
mkdir -p app/\(pwa\)/\(auth\)/sign-in/\[\[...sign-in\]\]
mkdir -p app/\(pwa\)/\(auth\)/sign-up/\[\[...sign-up\]\]
git mv app/\(auth\)/layout.tsx app/\(pwa\)/\(auth\)/layout.tsx
git mv "app/(auth)/sign-in/[[...sign-in]]/page.tsx" "app/(pwa)/(auth)/sign-in/[[...sign-in]]/page.tsx"
git mv "app/(auth)/sign-up/[[...sign-up]]/page.tsx" "app/(pwa)/(auth)/sign-up/[[...sign-up]]/page.tsx"
rmdir "app/(auth)/sign-in/[[...sign-in]]" "app/(auth)/sign-in" "app/(auth)/sign-up/[[...sign-up]]" "app/(auth)/sign-up" "app/(auth)"
```

- [ ] **Step 2: Verify the move**

```bash
ls app/\(pwa\)/\(auth\)/
```
Expected: `layout.tsx  sign-in/  sign-up/`

---

## Task 5: Move app routes and onboarding under (pwa)

**Files:**
- Move: `app/(app)/` → `app/(pwa)/(app)/`
- Move: `app/onboarding/` → `app/(pwa)/onboarding/`

All authenticated app routes move under the `(pwa)` group. URLs stay identical.

- [ ] **Step 1: Move the app route group**

```bash
git mv app/\(app\) app/\(pwa\)/\(app\)
```

- [ ] **Step 2: Move onboarding**

```bash
git mv app/onboarding app/\(pwa\)/onboarding
```

- [ ] **Step 3: Verify**

```bash
ls app/\(pwa\)/
```
Expected: `(app)/  (auth)/  layout.tsx  onboarding/`

---

## Task 6: Create the PwaGate client component

**Files:**
- Create: `components/pwa-gate.tsx`
- Modify: `app/(pwa)/(app)/layout.tsx`

The gate checks `display-mode: standalone` on mount. If the visitor is in a browser (not installed), they're redirected to `/install`. This is the second layer of defence after the middleware.

- [ ] **Step 1: Create `components/pwa-gate.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PwaGate() {
  const router = useRouter();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (!isStandalone) router.replace("/install");
  }, [router]);

  return null;
}
```

- [ ] **Step 2: Add PwaGate to `app/(pwa)/(app)/layout.tsx` and remove PwaInstallPrompt**

The existing layout at this path (was `app/(app)/layout.tsx`) currently renders `PwaInstallPrompt`. Since the app is now install-gated, that banner is redundant. Replace it with `PwaGate`.

Open `app/(pwa)/(app)/layout.tsx`. Make these two changes:

Remove the `PwaInstallPrompt` import:
```ts
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
```

Add the `PwaGate` import:
```ts
import { PwaGate } from "@/components/pwa-gate";
```

In the JSX, replace `<PwaInstallPrompt />` with `<PwaGate />`:
```tsx
return (
  <div className="min-h-screen bg-background lg:flex">
    <LiteModeInit />
    <PwaGate />
    <AppSidebar />
    <div className="flex-1 min-w-0 pb-16 lg:pb-0 lg:overflow-y-auto">
      {children}
    </div>
    <AppNav />
  </div>
);
```

- [ ] **Step 3: Verify the layout no longer imports PwaInstallPrompt**

```bash
grep -n "PwaInstallPrompt" app/\(pwa\)/\(app\)/layout.tsx
```
Expected: no output.

---

## Task 7: Create the /install page

**Files:**
- Create: `app/(pwa)/install/page.tsx`

Browser visitors to `app.ikigai.app` land here. It handles `beforeinstallprompt` and gives iOS users the manual steps. Uses the existing `usePwaInstall` hook.

- [ ] **Step 1: Create `app/(pwa)/install/page.tsx`**

```tsx
"use client";

import { Download, Share } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa-install";

export default function InstallPage() {
  const { prompt, isIOS, install } = usePwaInstall();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/30">
        <Download className="size-10 text-primary-foreground" />
      </div>

      <h1 className="font-display mb-3 text-4xl font-black text-foreground">
        Install Ikigai
      </h1>
      <p className="mb-10 max-w-xs text-muted-foreground">
        Ikigai is a PWA — install it to your home screen to get the full
        experience, offline support, and fast loading.
      </p>

      {isIOS ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-left text-sm text-muted-foreground">
          <p className="mb-3 font-semibold text-foreground">
            Install on iOS:
          </p>
          <ol className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              Tap the{" "}
              <Share className="inline size-4 text-primary" />{" "}
              Share button in Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              Scroll down and tap{" "}
              <strong className="text-foreground">Add to Home Screen</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              Tap <strong className="text-foreground">Add</strong>
            </li>
          </ol>
        </div>
      ) : prompt ? (
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-light hover:-translate-y-0.5"
        >
          <Download className="size-5" />
          Install App
        </button>
      ) : (
        <p className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
          Open this page in Chrome or Edge on Android, or Safari on iOS to
          install.
        </p>
      )}
    </div>
  );
}
```

---

## Task 8: Add ClerkProvider to admin

**Files:**
- Create: `app/admin/layout.tsx`

The root layout no longer provides ClerkProvider. The admin surface needs its own. We add a thin wrapper layout at `app/admin/layout.tsx` that covers all admin routes (sign-in page, sign-out page, and the protected group).

- [ ] **Step 1: Create `app/admin/layout.tsx`**

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
```

- [ ] **Step 2: Verify the admin sign-in page still uses Clerk components**

```bash
grep -n "SignIn\|ClerkProvider" app/admin/sign-in/\[\[...sign-in\]\]/page.tsx app/admin/layout.tsx
```
Expected: `SignIn` in the sign-in page, `ClerkProvider` in the new layout.

---

## Task 9: Update the middleware

**Files:**
- Modify: `proxy.ts`

Extend the existing Clerk middleware to enforce three surface boundaries:
- `ikigai.app` — only `/`, `/sso-callback`, and `/api/` pass through; everything else redirects to `/`
- `app.ikigai.app` — blocks `/admin` paths, protects authenticated routes, passes everything else
- `admin.ikigai.app` — existing behaviour unchanged

- [ ] **Step 1: Rewrite `proxy.ts`**

```ts
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
  const isAppSubdomain = hostname.startsWith("app.");
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
      !pathname.startsWith("/sso-callback")
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
      url.hostname = hostname.replace("app.", "admin.");
      return NextResponse.redirect(url);
    }
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // --- ikigai.app (marketing) ---
  // Allow: /, /sso-callback, /api/, and Next.js internals
  if (
    pathname !== "/" &&
    !pathname.startsWith("/sso-callback") &&
    !pathname.startsWith("/api/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Verify the file has no syntax errors**

```bash
bunx tsc --noEmit 2>&1 | head -20
```
Expected: no errors related to `proxy.ts`.

---

## Task 10: Update the manifest

**Files:**
- Modify: `app/manifest.ts`

The manifest is served from `app.ikigai.app`. `start_url` should be `/dashboard` (already correct). Add `scope` explicitly so the PWA scope is clear.

- [ ] **Step 1: Update `app/manifest.ts`**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ikigai — Purpose & Mentorship",
    short_name: "Ikigai",
    description:
      "Connecting young women in Sierra Leone with mentors and purpose.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF7",
    theme_color: "#1A5C3A",
    categories: ["education", "social", "lifestyle"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

- [ ] **Step 2: Run a type check to confirm the whole project compiles**

```bash
bunx tsc --noEmit 2>&1 | head -30
```
Expected: zero errors.

- [ ] **Step 3: Start the dev server and smoke-test routing**

```bash
bun dev
```

Manual checks (using `/etc/hosts` or a tunnel to simulate subdomains, or just checking route group structure is correct):
- `localhost:3000/` → marketing home (no sign-in link, no auth)
- `localhost:3000/dashboard` → redirected to `/` (marketing domain blocks it)
- Check that `app/(pwa)/(app)/`, `app/(pwa)/(auth)/`, `app/(pwa)/onboarding/`, `app/(pwa)/install/` all exist
- Check that `app/admin/layout.tsx` exists with ClerkProvider
- Check that `app/layout.tsx` has no ClerkProvider import
