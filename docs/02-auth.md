# 02 — Clerk → Better Auth

**Status:** planning. **Depends on:** the API skeleton. **Blocks:** everything after it.

Supersedes [`archive/implement_better-auth.md`](./archive/implement_better-auth.md),
which planned this migration with Better Auth mounted **inside Next.js**. The
move to NestJS changes where it lives and how sessions travel. Much of the
archived plan survives unchanged and is not repeated here in full — read it for
the detail, read this for what is different.

---

## Why, and why now

To own the user flow: our own sign-in forms, our own sequence, our own copy.
Secondarily: no third party holding identity data for minors.

**Not a cost reduction.** Clerk is free below 10,000 monthly active users and
there are 14. The saving is hypothetical. The ownership argument stands on its
own and should not be sold internally as a budget cut.

**Second in the order, deliberately.** 31 files import Clerk. Porting 118
server actions to NestJS against Clerk and *then* migrating auth would mean
touching every one of them twice. Doing auth immediately after the API skeleton
means every port afterwards is written against the final auth model, once.

---

## What carries over from the archived plan

These conclusions do not change and should not be re-litigated:

- **Better Auth adopts the existing `users` table.** `users.id` (uuid) stays the
  primary key, so all 48 tables' foreign keys keep pointing at the same rows.
  No data migration.
- **Do not run Better Auth's official Clerk migration script.** It creates rows
  keyed on Clerk's `user_xxx` strings, which would duplicate the users and
  orphan every foreign key. Account linking on verified email does the job with
  no scripting, and *is* the migration path.
- **`session.user` is not the full users row** — the adapter exposes only
  `id`, `name`, `email`, `emailVerified`, `image`. The database read stays;
  only the redundant one goes.
- **`role` and `verifiedAt` as `additionalFields` with `input: false`.** Without
  that, a signup request body could set `role: "admin"` — a self-service write
  to the entire authorization system.
- **Keep `displayName`/`avatarUrl`** and map them via `fields`. Renaming is 146
  references across 51 files inside an already-large migration.
- **The three password users switch to Google.** Clerk will not export password
  hashes; contact them before cutover, not after.
- The `drizzle.config.ts` `casing` mismatch, the new-table column rules, the
  email-lowercasing backfill, and the `create.before` duplicate guard — all as
  written in the archive.

### Re-verify before acting

Every number in the archived plan was measured on **28 August 2026**. That is
three weeks stale as of writing. Re-run the counts before Phase 1 — if the user
table has grown much, the risk calculus changes.

| Measured 28 Aug | |
|---|---|
| Clerk users ↔ local rows | 14 ↔ 14, zero drift |
| Google OAuth only | 11 — **including both admins** |
| Password only | 3 |
| Emails non-null, case-insensitively unique | 14 / 14 |

Both admins being on Google is what makes an admin lockout unlikely. Confirm it
still holds.

---

## What changes: Better Auth lives in `api/`

The API is the single auth origin. This is the decision that supersedes the
archived plan, and it has consequences the archive does not cover.

```
  mobile/  Expo  ──── bearer token, expo plugin, SecureStore ───┐
                                                                 │
  client/  marketing  ─┐                                         ▼
           admin      ─┼── session cookie, parent domain ──► api/  Better Auth
           pwa        ─┘                                        │
                                                                ▼
                                                        Neon — users, session,
                                                        account, verification
```

### Three new problems the archive did not have

1. **A native client has no cookies.** Expo uses Better Auth's Expo plugin with
   a token in `expo-secure-store`, not a cookie. Two session transports against
   one auth server. The guard in `api/` must accept both, and must not assume
   either.

2. **The API is a fourth origin.** The archive dealt with apex / `app.*` /
   `admin.*` sharing a parent-domain cookie. Now the API sits on its own host
   and the browser clients call it cross-origin. This makes CORS, `credentials:
   "include"`, `SameSite` and the cookie domain **one coupled decision**, not
   four independent ones. Settle it with the deployment question in
   [01-api-server.md](./01-api-server.md).

   The cheapest way out is putting the API on a subdomain of the same parent
   domain (`api.<domain>`) so the session cookie is shared rather than
   third-party. Browsers are increasingly hostile to the alternative. Prefer it.

3. **`proxy.ts` no longer reads a Clerk session.** The archive replaced
   `clerkMiddleware` with `getCookieCache` from `better-auth/cookies`. That
   still applies, with the same constraints: use the signed cookie cache, never
   `getSessionCookie` (an existence check, documented as insecure), and never
   the full `getSession` — it would pull the auth stack and the Neon driver into
   a bundle that loads on every request to the seven prerendered marketing
   pages, which is exactly what the dynamic-import comment in `proxy.ts` exists
   to prevent.

   **Preserve unchanged:** the one-minute role cache, its dynamic imports, and
   the *rewrite* (not redirect) to `/admin/unauthorized`. If the cookie cache
   has expired, **fall through** rather than guessing "signed out" —
   `requireAdmin()` in the admin layout is the authoritative gate. Guessing is
   what creates redirect loops.

---

## Phase 0 — before any code

### 0.1 Disable the Clerk webhook today

`client/app/api/webhooks/clerk/route.ts` re-links accounts by email with **none**
of the three guards `lib/db-user.ts` has — no verified-email check, no
`ne(role, "admin")`, no `isNull(deletedAt)`. Anyone signing up with an admin's
address inherits the admin row.

This is a live account-takeover path. It is unrelated to the migration and
should not wait for it. **Disable the endpoint in the Clerk dashboard now.**

### 0.2 Spike the unknowns

Throwaway branch, roughly an hour, against a staging database:

1. **Neon HTTP transactions.** `db.transaction()` throws on the HTTP driver, and
   Better Auth's create-user-and-account path is transactional by default. This
   is the likeliest thing to break the whole plan — settle it first. Fallback: a
   second Drizzle client on `neon-serverless` (WebSocket) used *only* by the
   auth adapter.
2. **The `fields` mapping direction** — `{ name: "displayName" }` (JS property
   key), not the SQL column name. Prove it with one signup.
3. **Whether password reset works with no `account` row**, which decides whether
   the three password users have any route in besides Google.
4. **Expo plugin + Nest**: prove the native token flow reaches the same guard as
   the cookie flow. New since the archive, and the thing most likely to surprise.

Run `bunx @better-auth/cli generate` and read the output. That is the source of
truth for session/account/verification columns in the installed version — not
the docs, and not this file.

### 0.3 Prerequisites

- A Google Cloud OAuth client, redirect URI on the API origin
- Staging hostnames and a Neon branch cloned from production
- Confirm all 14 users' Google addresses match `users.email` after lowercasing

---

## Phases

| Phase | Contents | Risk |
|---|---|---|
| **1 — Foundation** | `casing` fix, `users` table changes, the three Better Auth tables + `rateLimit`, the lowercasing backfill, `AuthModule` in `api/`. Clerk still fully in charge; nothing user-facing changes. Independently revertible. | None |
| **2 — Cutover** | Atomic. The guard replaces `lib/db-user.ts` internals, 33 `auth()` sites, `proxy.ts`, the new sign-in screens, `lib/purge.ts`, the IndexedDB bump, delete the Clerk webhook. | **High** |
| **3 — Cleanup** | ≥1 week later: drop `users.clerkId`, remove `@clerk/nextjs` and `svix`, tighten the CSP. | Low |
| **4 — Email/password** | Blocked on a working email provider. | — |

### Phase 2 is atomic and that is not negotiable

A page rendering under Clerk auth cannot call a server action that reads a
Better Auth session. There is no incremental path through it.

`lib/db-user.ts` is the leverage point: **its exported signatures do not
change**, so roughly 110 indirect consumers stay untouched. Internally
`fetchUserByClerkId` becomes a session read. Two details from the archive that
are easy to lose and expensive to lose:

- **Add `isNull(users.deletedAt)` to the lookup.** Today that filter is
  unnecessary only because the `clerk_id` tombstone made purged rows
  unlookupable — and that mechanism is being removed.
- **`app/api/uploadthing/core.ts`'s avatar route** runs `onUploadComplete` in a
  separate request from UploadThing's servers **with no user cookies**. It
  correctly uses metadata today. Do not "simplify" it into a session read.

Deploy in Sierra Leone's low-traffic window, with both admins present and
signed out.

---

## Email

**Not needed for the migration** — Google OAuth sends no mail, and all 14 users
can sign in with SMTP unset.

**Needed for the product, today, regardless of auth.** `lib/email.ts` silently
no-ops when SMTP is unset, returning a *success* shape after a `console.log`.
Guardian invite codes and mentor verification decisions are being written and
dropped in production right now. That is a live bug this migration merely puts
a deadline on.

Phase 4 additionally requires it: without delivery there is no password reset,
so a mentee who forgets their password loses their journal and their mentor
permanently.

---

## Risks

1. **Neon HTTP transactions** — can invalidate the approach. Phase 0.2.
2. **Cookie domain and CORS across four origins** — an unset cookie domain
   should be a **hard boot failure in production**. That single guard is the
   most important line in the migration.
3. **Account linking is the migration.** Three defences: lowercase every email
   in the backfill; the `create.before` guard that makes a split account
   impossible rather than merely detectable; `newUserCallbackURL` as an alarm —
   any *existing* user landing there means linking failed.
4. **Two controls disappear that Clerk gave for free** — bot protection and rate
   limiting on credential endpoints. Better Auth's default limiter is
   in-memory, which on serverless is per-instance and close to useless; use
   `storage: "database"`. A public sign-in endpoint with neither, on a platform
   holding safeguarding records about minors, is a real regression.
5. **`cookieCache` is load-bearing, not an optimisation** — without it every
   request gains a Neon round-trip on metered mobile data. But it is stale by up
   to `maxAge`, so **never authorize off it**. `requireApprovedMentor` keeps its
   live `verifiedAt` read: a mentor rejected mid-incident must lose access
   immediately, not when a cache expires.
6. **Remote session revocation is lost.** Clerk's dashboard could force
   sign-out; nothing replaces it. That is a safeguarding capability, not a
   nicety. Add revocation to the admin mentor-rejection flow in Phase 3.

### Rollback

Phase 1 is purely additive and Clerk stays installed through Phase 2, so either
reverts with one `git revert`. Keep the Clerk application live for 30 days, keep
`clerk_id` for a month, and take a Neon branch snapshot immediately before
cutover.

**Triggers:** user count ≠ expected, an admin locked out, a redirect loop on any
surface, or `/api/auth/*` 5xx above baseline.

---

## Verification

Three cheap tests worth writing, from the archive — they catch the two bugs that
would hurt most:

- **schema test** — the JS property keys the adapter indexes exist; `clerk_id`
  is nullable; `email` has a unique index; new `userId` columns are `uuid` not
  `text`; no new column name contains an uppercase character, which locks in the
  `casing` fix permanently.
- **config test** — `user.additionalFields.role.input === false`, because a
  regression there is privilege escalation through a signup body.
- **no-clerk test** — walks the source asserting zero `@clerk` / `clerkId`
  matches, so a future merge cannot reintroduce one.

The real safety net is a manual staging pass. From the archive's list, plus one
new:

1. Google sign-in on `app.*`, then straight to `admin.*` — no second sign-in.
   *This proves the cookie domain.*
2. Signed-out user hits `admin.*/anything` — exactly one redirect. Check the
   network tab for a chain, not just the final page.
3. Non-admin hits `admin.*` — `/admin/unauthorized` renders **in place, URL
   unchanged**.
4. A seeded user with foreign-key children signs in — the `account` row attaches
   to the **existing** `users.id`, journal entries still visible, count unchanged.
5. Signup with an existing email — refused by the hook, no duplicate.
6. Revoke a mentor's `verified_at` while signed in — next action refused
   **immediately**.
7. Purge a seeded account — sessions and accounts gone, `safety_reports`
   foreign key intact.
8. **New:** the Expo app and a browser hold sessions for the same user at once;
   revoking one does not sign out the other unintentionally.
