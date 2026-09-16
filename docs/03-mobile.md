# 03 — The Expo app

**Status:** planning. **Depends on:** [01-api-server.md](./01-api-server.md), [02-auth.md](./02-auth.md).

Rebuilding the authenticated product surface — `client/app/(pwa)/` — as a React
Native app on Expo SDK 57 with expo-router.

---

## Scope

104 files, 54 of them client components, across these routes:

| Area | Routes |
|---|---|
| Core loop | `dashboard`, `journal`, `journey`, `purpose-book`, `goals` |
| Mentorship | `mentors`, `mentors/[id]`, `mentorship`, `mentorship/[id]`, `mentorship/[id]/plan`, `mentorship/[id]/verify` |
| Mentor side | `mentor-portal`, `mentor-portal/[menteeId]` |
| Community | `groups`, `groups/[id]`, `activities`, `activities/[id]` |
| Tasks | `tasks/[id]` |
| Safety | `safety`, `safety/help`, `pad-her-power` |
| Oversight | `parent-portal`, `parent-portal/mentors` |
| Account | `settings`, `notifications` |
| Auth | `sign-in`, `sign-up` |
| Onboarding | `onboarding` + mentee (4 steps), mentor (2), parent (2) |

**This is a rebuild, not a port.** The screens are React Server Components
calling server actions. Neither mechanism exists in React Native. What carries
over is the product design, the copy, and the logic — once that logic is behind
the API.

**Do not start a screen before its endpoints exist.** The dependency runs
one way: [01](./01-api-server.md) builds the endpoint, then the screen is built
against it. A screen written against a not-yet-existing API is a screen written
twice.

---

## What does not survive the move

| In `client/` | In `mobile/` |
|---|---|
| Server Components, server actions | Data fetching in the client, against the API |
| `next/image` | `expo-image` (already installed) |
| `next/link`, `useRouter` | `expo-router` (already installed) |
| framer-motion (growth tree) | `react-native-reanimated` 4.5.1 (already installed) |
| Leaflet + OpenStreetMap tiles (Pad Her Power) | a native map — **not yet chosen** |
| `idb` / IndexedDB (offline journal) | `expo-sqlite` — **not yet installed** |
| web-push + service worker | `expo-notifications` — **not yet installed** |
| UploadThing browser SDK | `expo-image-picker` + direct upload — **not yet installed** |
| Clerk React components | Better Auth Expo plugin + `expo-secure-store` — **not yet installed** |
| Tailwind v4 classes | a styling approach — **not yet chosen**, see below |

The scaffold currently has expo-router, reanimated, gesture-handler,
expo-image, expo-font, expo-web-browser, expo-linking and the `@expo/ui`
family. Everything in the "not yet installed" rows above is still to be added.

---

## The three hard parts

Ranked by how likely they are to consume more time than expected.

### 1. The offline journal

`lib/offline-journal.ts` is 247 lines of IndexedDB queue-and-sync, and it is the
feature that most embodies the product's stated constraint — an offline-first
journal for users on unreliable connectivity. None of it ports: `idb` is a
browser API.

It needs rebuilding on `expo-sqlite`, with the same shape: queue locally, sync
when connectivity returns, reconcile on conflict. Budget for this as its own
piece of work, not as part of the journal screen.

Two details from the existing implementation that must survive:

- Queued entries are stamped with an owner id and validated against
  `expectedOwnerId` on sync. Shared phones are common in this context; an entry
  must never sync into the wrong account.
- The store is versioned and dropped on upgrade rather than migrated. Keep that
  discipline — it also covers users who never sign out, which is most of them.

### 2. Push notifications

The 39-key catalog in `lib/notifications/catalog.ts` is web-push. Expo uses its
own push service and its own token registration.

**The catalog must not fork.** It stays in the API as the single definition of
what can be sent, to whom, at what priority and with what cooldown; delivery
grows a second transport beside web-push. `users.pushSubscription` currently
holds a Web Push subscription object — mobile tokens need their own storage, and
one user may legitimately have both.

Note `priority: "low"` never sends a push, and `category: "account"` is not
opt-out-able. Those rules are product decisions and apply equally on mobile.

### 3. Pad Her Power's map

Leaflet with OpenStreetMap tiles, plus offline tile caching on the roadmap. A
native map is a different component with different licensing and a different
offline story. Treat it as its own decision, late in the order — it is the most
self-contained screen and the least blocking.

---

## Styling

**Not yet decided, and it should be decided before the first screen.**

`client/app/globals.css` defines the design system as oklch Tailwind v4 tokens:
forest green `--primary #1A5C3A`, golden `--accent #F5A623`, terracotta
`--earth #C05C3A`, with Fraunces 900 for display and DM Sans for body.

The two options:

- **NativeWind** — keeps the Tailwind class vocabulary, so screens read like
  their web counterparts and the token names carry across. Verify its Tailwind
  v4 support before committing; a mismatch here is discovered late and hurts.
- **StyleSheet with a shared token module** — no compatibility risk, no build
  step, but every screen is written twice in two idioms.

Either way, **the tokens are defined once** and exported in a form both
projects consume. Two colour palettes drifting apart is the visible version of
the same failure mode [01](./01-api-server.md) warns about for logic.

---

## Auth

Better Auth's Expo plugin, token in `expo-secure-store`. The API accepts both
that and the browser's cookie — see [02-auth.md](./02-auth.md), which treats
this as one of the three problems the original Clerk plan did not have.

Prove the native flow reaches the same guard as the cookie flow during the
Phase 0 spike, before any screen depends on it.

---

## Order

1. **Shell** — expo-router layout, tab/stack navigation matching `app-nav.tsx`
   and `app-sidebar.tsx`, the token module, fonts. No data.
2. **Auth + onboarding** — sign-in, sign-up, and the role-branching onboarding
   flow. Nothing else is reachable without a user, and the resume logic in
   `app/(pwa)/(app)/layout.tsx` has to be reproduced faithfully: a half-onboarded
   user must land on the right step.
3. **Dashboard** — the landing surface, and the first screen that proves the
   data path end to end.
4. **Journal** — including the offline queue. Early, because it is the hardest.
5. **Journey / growth tree** — the reanimated work.
6. **Mentorship** — mentor list, request, thread, messaging. The core loop and
   the largest area.
7. **Mentor portal** — the mentor side of the same loop.
8. **Goals, purpose book, groups, activities, tasks** — independent,
   parallelisable.
9. **Settings, notifications, parent portal**.
10. **Safety and Pad Her Power** — deliberately last so the map decision does not
    block anything, but **not optional**: safeguarding is load-bearing on this
    platform, and a half-built safety surface is worse than none.

---

## Open questions

- **Which map library**, and whether offline tiles are in scope for v1
- **NativeWind or StyleSheet** — blocks screen 1
- **Distribution**: Play Store only, or also direct APK? Direct install matters
  for an audience where Play Store access is not universal
- **Minimum Android version**, which follows from what devices are actually in
  use — and should be answered with data, not assumed
- **App size.** The product principle is low-bandwidth; a large initial download
  contradicts it. Worth a budget, set early
- **Does the app need its own offline story beyond the journal?** The dashboard
  and journey screens are read-heavy and would benefit
