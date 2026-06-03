# App Overhaul — Three-Surface Architecture

**Date:** 2026-06-03  
**Status:** Approved

## Goal

Split the single Ikigai Next.js app into three distinct surfaces served from one codebase, each with its own domain, auth posture, and purpose.

| Surface | Domain | Auth | Purpose |
|---|---|---|---|
| Marketing | `ikigai.app` | None | Company page, install prompt |
| PWA | `app.ikigai.app` | Clerk | The app — standalone only |
| Admin | `admin.ikigai.app` | Clerk (admin) | Manage the platform |

## Domain Routing — Middleware

`proxy.ts` (the Clerk middleware) detects hostname and enforces surface boundaries:

- **`ikigai.app`** — only `/` (and future marketing pages like `/about`, `/privacy`) are served. Any other path redirects to `/`.
- **`app.ikigai.app`** — serves PWA routes. If the visitor is not in standalone mode (`display-mode: standalone`), they are rewritten to `/install`. If standalone, normal app routing applies.
- **`admin.ikigai.app`** — existing behavior unchanged: rewrites paths to `/admin/*`, blocks sign-up, redirects to sign-in.

## Route Group Structure

```
app/
├── (marketing)/
│   ├── layout.tsx        ← plain layout, no ClerkProvider
│   └── page.tsx          ← home/marketing page
│
├── (pwa)/
│   ├── layout.tsx        ← ClerkProvider lives here
│   ├── install/
│   │   └── page.tsx      ← install instructions + beforeinstallprompt handler
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx    ← PWA gate check + app shell
│   │   ├── dashboard/
│   │   ├── journal/
│   │   ├── journey/
│   │   ├── mentorship/
│   │   ├── pad-her-power/
│   │   ├── safety/
│   │   ├── school/
│   │   └── settings/
│   └── onboarding/
│
├── admin/                ← unchanged
│
└── layout.tsx            ← bare root (fonts, globals.css only — no ClerkProvider)
```

## ClerkProvider Placement

`ClerkProvider` is removed from `app/layout.tsx` (root) and placed only in `app/(pwa)/layout.tsx`. The marketing surface never loads Clerk. The admin layout already has its own Clerk setup via the existing sign-in page.

## PWA Gate

A client component in `app/(pwa)/(app)/layout.tsx` runs on mount:

```ts
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || (navigator as any).standalone === true; // iOS Safari
if (!isStandalone) router.replace('/install');
```

This is the second layer of defence (middleware is first). Two layers, each doing one job:
1. Middleware: hostname → surface mapping
2. Client component: display-mode → install gate

## Install Flow

1. User visits `ikigai.app` → sees marketing page with **"Get the App"** CTA
2. CTA navigates to `app.ikigai.app`
3. `app.ikigai.app` in browser → middleware rewrites to `/install`
4. Install page handles `beforeinstallprompt`, walks user through installation
5. After install, PWA launches at `app.ikigai.app` in standalone mode
6. Standalone → PWA gate passes → user reaches sign-in / dashboard

The manifest `start_url` and service worker scope are both on `app.ikigai.app`.

## Auth

- **Marketing (`ikigai.app`):** No auth at all. No Clerk. No sign-in links.
- **PWA (`app.ikigai.app`):** Clerk for users (sign-in, sign-up, onboarding). Protected routes stay protected.
- **Admin (`admin.ikigai.app`):** Clerk, admin-only sign-in. No sign-up. The admin layout (`app/admin/(protected)/layout.tsx`) gets its own `ClerkProvider` since the root layout no longer provides one.

## What Is Not Changing

- Route handler files under `app/api/` — no changes
- Admin routes under `app/admin/` — no changes
- DB schema, Clerk webhooks, Drizzle config — no changes
- Page content — architecture only; page redesigns are a separate task
- Service worker (`public/sw.js`) — stays, just scoped to `app.ikigai.app`
