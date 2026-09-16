# Migrating from Clerk to Better Auth

**Status:** planned, not started. **Written:** 28 August 2026.

Every number below was measured against production on that date. Re-check the
[Verified facts](#verified-facts) table before acting on this — if the user count has
moved much, the risk calculus in here changes.

---

## Why

To own the user flow: our own sign-in forms, our own sequence, our own copy. Secondary:
no third party holding identity data for minors, and no per-user pricing ceiling.

**This is not a cost reduction.** Clerk is free below 10,000 monthly active users and we
have 14, so we pay $0 today and would pay $0 after. The saving is hypothetical, at ~10k
users. The ownership argument is the real one and it stands on its own — but nobody
should sell this internally as a budget cut.

**Now is the cheapest this will ever be.** The migration's difficulty scales with the
user table, and ours is 14 rows.

---

## Verified facts

Measured 28 Aug 2026 against the Clerk API and production Neon.

| | |
|---|---|
| Clerk users ↔ local `users` rows | 14 ↔ 14, zero drift, zero tombstones |
| Google OAuth only | 11 — including **both admins** |
| Password only | 3 (1 mentor, 2 mentees) |
| Both / neither method | 0 |
| Emails non-null and case-insensitively unique | 14 / 14 |
| Files importing Clerk | 34 |
| `auth()` call sites | 33, plus 1 `currentUser()` |
| Indirect consumers via `lib/db-user.ts` | ~110 (these need **no** change) |

Both admins being on Google matters: we cannot lock ourselves out of the admin surface.
Three password users matters: the one genuinely hard part of a Clerk migration — password
hashes, which Clerk will not export — costs us three phone calls.

## Decisions already made

- Keep **both** Google and email/password as methods, but ship Google first
- The 3 password users switch to Google; their Clerk hashes are **not** migrated, so no
  bcrypt compatibility layer is needed
- They get contacted **before** cutover, not left to discover it
- Delivery is **four phased PRs** with review between, not one big branch

## Do we need an email provider?

**Not for the migration.** Google OAuth sends no mail; all 14 users can sign in with SMTP
unset.

**Yes for email/password** — not to sign in, but to *recover*. Without delivery there is no
password reset, so a mentee who forgets their password loses their journal and their
mentor permanently.

**And yes for the product, regardless of auth.** `lib/email.ts` silently no-ops when SMTP
is unset (returns `{dev: true}` after a `console.log`), so guardian invite codes and mentor
verification decisions are being written and dropped in production **today**. That is a live
bug this migration merely puts a deadline on.

Options: Amazon SES ~$0.10/1,000 but needs domain verification and a sandbox exit;
Resend or Postmark cost more and take about ten minutes.

---

## Target architecture

Better Auth **adopts the existing `users` table**. `users.id` (uuid) stays the primary key,
so every foreign key in the schema keeps pointing at the same rows — no data migration,
no orphans, no downtime for the domain data.

`users.clerk_id` stops being the identity key. Today each `auth()` call is followed by
`eq(users.clerkId, userId)` to fetch the row; afterwards one `requireUser()` returns it,
taking those sites from two round-trips to one.

> **`session.user` is NOT the full users row.** The adapter filters to fields it knows
> about: `id`, `name`, `email`, `emailVerified`, `image`. No `role`, `verifiedAt`, `bio`,
> `currentStage`, `deletedAt`. So the database read stays — only the *redundant* one goes.
> Declaring twenty columns as `additionalFields` to avoid it would make each one writable
> through the auth API, which is the opposite of what we want.

**Do not run Better Auth's official Clerk migration script.** It creates new user rows keyed
on Clerk's `user_xxx` string ids, which would duplicate our 14 users and orphan every
foreign key. Account linking does the same job with no scripting.

---

## Phase 0 — Before any code

### 0.1 Disable the Clerk webhook today

`app/api/webhooks/clerk/route.ts:78-87` re-links accounts by email with **none** of the
three guards `lib/db-user.ts` has — no verified-email check, no `ne(role, "admin")`, no
`isNull(deletedAt)`. Anyone who signs up with an admin's address inherits the admin row.

This is a live account-takeover path, it is unrelated to the migration, and it should not
wait for it. Disable the endpoint in the Clerk dashboard now.

### 0.2 Spike three unknowns (~1 hour, throwaway branch)

Each would otherwise surface at the worst possible moment.

1. **Neon HTTP has no interactive transactions.** `db.transaction()` *throws* on the HTTP
   driver, and Better Auth's create-user-and-account path is transactional by default.
   Call `signUpEmail` against a staging DB and find out. If it throws, set the adapter's
   `transaction: false`; if that option is absent in 1.7.2, the fallback is a second Drizzle
   client on `neon-serverless` (WebSocket) used *only* by the auth adapter, leaving
   `db/db.ts` alone. **This is the likeliest thing to break the whole plan.** Settle it first.
2. **The `fields` mapping direction.** The adapter indexes the Drizzle table object by JS
   property key, so it should be `{ name: "displayName" }`, not `"display_name"`. Prove it
   with one sign-up and read the row.
3. **Password reset with no `accounts` row.** Our 3 password users will have zero at
   cutover. If `requestPasswordReset` refuses without a credential account, Google is
   their *only* way in — so confirm all three have a Google account on that address.

Also run `bunx auth@latest generate --adapter drizzle --dialect postgresql` and read the
output. That is the source of truth for the session/account/verification columns in the
installed version, not the docs and not this file.

### 0.3 Other prerequisites

- Create a Google Cloud OAuth client. Redirect URI: `https://app.<domain>/api/auth/callback/google`
  plus a staging equivalent. One canonical auth origin.
- Stand up staging on its own hostnames and a Neon branch cloned from production.
- Confirm each of the 14 users' Google address matches `users.email` after lowercasing.

---

## Phase 1 — Foundation (invisible, deployable)

Clerk stays fully in charge. Nothing user-facing changes. This de-risks the schema from the
code, and is independently valuable and independently revertible.

### Fix `drizzle.config.ts` first

`casing: "snake_case"` is set in `db/db.ts:14` but **not** in the drizzle-kit config.
That mismatch is invisible today because every existing column carries an explicit SQL
name. Write the new tables relying on `casing` and the runtime will query `user_id` while
push created `"userId"` — silent, total failure on first sign-in.

Add `casing` to the config **and** give every new column an explicit name string (house
style anyway). Run `bunx drizzle-kit generate` and read the SQL: existing tables must
produce a zero diff.

### `users` table changes

| Change | Why |
|---|---|
| `clerkId` → drop `.notNull()`, **keep the column** | Better Auth inserts without it. It is currently the only NOT NULL column with no default, so its first insert would fail. Keeping it is the rollback path. |
| add `emailVerified: boolean().notNull().default(false)` | Required by Better Auth. **Boolean, not a timestamp** — that's Auth.js. |
| add `updatedAt: timestamp().notNull().defaultNow().$onUpdate(...)` | Required by Better Auth |
| `createdAt` → add `.notNull()` | Better Auth's typing expects it; verified no NULLs |
| `interestTags` → add `.default(sql\`ARRAY[]::text[]\`)` | Replaces the seeding `getOrCreateDbUser` does today |
| `users_email_idx` → **unique** index | Better Auth needs it. Keep the column nullable — `lib/purge.ts` nulls it for tombstones, and Postgres allows multiple NULLs under a unique index. |

**Keep `name`/`image` as a `fields` mapping; do not rename the columns.** `displayName`
and `avatarUrl` appear across 51 files / 146 references. Renaming would remove all
adapter-mapping doubt but costs a 146-site refactor inside an already-large migration.

### Three new tables

`session`, `account`, `verification`, at the bottom of `db/schema.ts` under a header
comment saying they are Better Auth-owned and their columns come from `auth generate`,
so nobody "tidies" them later. Name the JS consts `authSessions` / `authAccounts` to avoid
colliding with any future domain concept called "account".

Requirements:
- Every column gets an explicit SQL name string
- `id: uuid().primaryKey().defaultRandom()` on **all three** — `generateId: false` is
  global, not per-model, so Postgres must mint ids for every table
- `userId: uuid().references(() => users.id, { onDelete: "cascade" })` — `uuid`, not `text`
- Index `sessions.user_id`, `sessions.token`, `accounts.user_id`, `verifications.identifier`
- The `(issuer, accountId)` compound unique on `account`
- Add the `rateLimit` table too (see Risk 4)

### Backfill

New `scripts/backfill-auth.ts`, run once:

```sql
update users set email = lower(email) where email is not null and email <> lower(email);
update users set email_verified = true where email is not null;
update users set updated_at = coalesce(created_at, now()) where updated_at is null;
```

Lowercasing matters: the adapter's `findOne({email})` is a case-sensitive `eq`, and our
Clerk-era rows were never normalised. **This is one of the three defences against a user
getting a duplicate row at cutover.**

Then `bun run db:push`, answering **No** to any truncation prompt (SETUP.md:45).
Confirm `select count(*) from users` is still 14.

### `lib/auth.ts`

Key config decisions, each with the reason it matters:

- `baseURL` set explicitly — or production gets `redirect_uri_mismatch`
- `trustedOrigins`: app, admin and marketing URLs, so the admin host can POST to `/api/auth/*`
- `transaction: false` on the adapter (pending Phase 0.2)
- `advanced.database.generateId: false` — Postgres's `defaultRandom()` owns ids
- `advanced.crossSubDomainCookies` with the parent domain — see Risk 2
- `user.fields: { name: "displayName", image: "avatarUrl" }` — JS property keys
- `user.additionalFields` for `role` and `verifiedAt`, both **`input: false`**. Without
  that, a `signUpEmail` request body could set `role: "admin"` — a self-service write to
  the entire authorization system. Same reasoning as `SELF_ASSIGNABLE_ROLES` in
  `app/(pwa)/onboarding/actions.ts`.
- `session.cookieCache` enabled — see Risk 5
- `account.accountLinking: { enabled: true, trustedProviders: ["google"] }`.
  `disableImplicitLinking` must stay false; implicit linking on verified email **is** the
  migration path for all 14 users.
- `rateLimit: { storage: "database" }` — see Risk 4
- `databaseHooks.user.create.before`: refuse a signup whose email already exists on a
  non-deleted row. Account linking should have matched them already; a collision here
  means linking **failed** and we are about to create a duplicate that orphans every FK
  pointing at the original. A blocked signup is recoverable; a split account is not.
  Move the deleted webhook's guard reasoning into this comment so the institutional
  knowledge survives.
- `nextCookies()` **last** in `plugins[]` — server actions cannot set cookies otherwise

Plus `lib/auth-client.ts` (`createAuthClient`, no provider component needed) and
`app/api/auth/[...all]/route.ts` (`toNextJsHandler`).

`lib/env.ts` gains `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`AUTH_COOKIE_DOMAIN` — the last **required in production, throwing at boot if unset**.

**Someone must create the Google OAuth client in Google Cloud Console.** Better Auth talks
to Google directly rather than through Clerk. Free, about ten minutes.

---

## Phase 2 — Cutover (atomic)

Sign-in pages, `lib/db-user.ts` and `proxy.ts` flip together. There is no incremental path:
a page rendering under Clerk auth cannot call a server action that reads a Better Auth
session.

### `lib/db-user.ts` — the leverage point

**Exported signatures do not change.** That is the whole point: ~110 indirect consumers
stay untouched. Internally, `fetchUserByClerkId` becomes a session read
(`auth.api.getSession`) still wrapped in React `cache()`.

- `getOrCreateDbUser` collapses to `getDbUser()` + throw. Delete the ~60 lines of
  relink logic — Better Auth creates the row in-process.
- **Add `isNull(users.deletedAt)` to the lookup.** Today that filter is unnecessary only
  because the `clerk_id` tombstone made purged rows unlookupable, and that mechanism is
  being removed. Without it, a purged user with a live session resolves.
- New `requireUser(): Promise<DbUser>` for the 22 server actions.
- `requireApprovedMentor` keeps its **live** `verifiedAt` read — never source that from the
  cookie cache (Risk 5).

### The five `auth()` shapes

Mechanical. 22 server actions (`auth()` + row query → one `requireUser()`); 4 route
handlers (401 JSON); 4 UploadThing middlewares (keep throwing `UploadThingError`);
2 redirect sites; 1 silent return in `safety/actions.ts:58`.

Two that need care:
- **`app/(pwa)/onboarding/actions.ts`** — `patchOnboardingData(clerkId, ...)` takes a Clerk
  id at three call sites. `setRole`'s `eq(users.role, "mentee")` guard is unrelated and
  must survive.
- **`app/api/uploadthing/core.ts`** avatar route — `onUploadComplete` runs in a separate
  request from UploadThing's servers **with no user cookies**. It correctly uses metadata
  today and must continue to. Do not "simplify" it into a `getDbUser()` call.

### Client

Delete `<ClerkProvider>` from both layouts with no replacement. `useUser()` (3 files) and
`useAuth()` (`journal-client.tsx:89`) become `authClient.useSession()`.

The five `useClerk().signOut` sites need **no change** — they already funnel through
`signOutAndClearOfflineJournal` in `lib/offline-journal.ts:237`, which structurally types
signOut rather than importing Clerk. Provide a `signOutLike` shim matching that type. Use
`window.location.href` in it, not `router.push`, so the RSC cache is dropped on sign-out —
a real disclosure risk on shared devices.

### `proxy.ts` — the riskiest file

Unwrap `clerkMiddleware`. Everything else — the asset bypass, `PWA_PATHS`, the
marketing/app/admin branches — is unchanged.

Use `getCookieCache` from `better-auth/cookies` (cryptographically signed, no DB call), not
`getSessionCookie` (existence check only, explicitly documented as insecure). **Do not** use
the full `auth.api.getSession`: it would pull Better Auth, the Drizzle schema and the Neon
driver into a bundle that loads on every request to the seven prerendered marketing pages —
precisely the cost the dynamic-import comment at `proxy.ts:19-26` exists to avoid.

**Preserve unchanged:** the 1-minute role cache, its dynamic imports, and the *rewrite*
(not redirect) to `/admin/unauthorized`.

If the session cookie is present but the cookie cache has expired, **fall through** rather
than guessing "signed out" — `requireAdmin()` in the admin layout is the authoritative gate
and redirects on the same domain. Guessing is what creates a loop.

The old comment warns a manual redirect would "bounce forever" because Clerk materialises
sessions per-subdomain via a handshake. That mechanism is gone — Better Auth has no
handshake — but three new loop conditions replace it, all defended in Risk 2.

Add `/forgot-password`, `/reset-password`, `/verify-email` to `PWA_PATHS`.

### The custom auth screens

Delete the four `[[...sign-in]]` / `[[...sign-up]]` catch-alls (they existed only for
Clerk's internal sub-routes). Build these as **server actions with progressive-enhancement
forms**, not client-side fetch — this audience is on low-bandwidth mobile and the codebase's
idiom is server actions. Google is the exception: it must be a redirect.

| Route | Contents |
|---|---|
| PWA `sign-in` | Google button (dominant — 11 of 14 users), divider, email + password, forgot-password link |
| PWA `sign-up` | Google + name/email/password (`name` maps to `displayName`), `callbackURL: "/onboarding"` |
| `forgot-password` | **Identical success message whether or not the address exists** — no enumeration. Pair with the un-awaited `void sendMail`. |
| `reset-password` | Reads `?token=`, handles expired/invalid with a route back |
| `verify-email` | Landing page after Better Auth's redirect, with resend |
| Admin `sign-in` | Google + email/password, **no sign-up link** |

Password policy: `minPasswordLength: 10`. Mentees may be 13, and a 3-user credential
population makes a stricter floor free.

**Prove the admin OAuth round-trip in staging.** An admin signing in at `admin.*` POSTs
same-origin, Better Auth builds a redirect_uri at `app.*` (the single `baseURL`), Google
returns to `app.*`, the cookie is set at the parent domain, and Better Auth redirects back
to `admin.*` via `trustedOrigins`. The OAuth state/PKCE cookies must also be parent-scoped.
If it doesn't work, the fallback is routing admins through `app.*/sign-in?redirect=...` for
the OAuth leg only.

### Other Phase 2 changes

- **Offline journal:** bump `OFFLINE_JOURNAL_DB_VERSION` 2 → 3 and drop the store, exactly
  as the documented v1→v2 upgrade did. Queued entries are stamped with the Clerk `userId`
  and would be rejected after the id format changes. Better than clearing on sign-out,
  because it also covers users who never sign out — the majority, on shared phones.
  Must land in the same commit as `journal/actions.ts:32`'s `expectedOwnerId` change.
- **`lib/purge.ts`:** replace the `clerk_id` tombstone with deleting the user's `session`
  and `account` rows. No account row means no way to sign in — the same guarantee by
  better means. This is a **strict improvement**: today a purged user's live Clerk session
  was left alive and merely failed to resolve; now it is actually revoked.
- **Delete `app/api/webhooks/clerk/route.ts`** (it carries the takeover bug).

### At the moment of cutover

All sessions invalidate; everyone signs in again. The 11 Google users click Continue with
Google → no `accounts` row → OAuth → email match → because linking is enabled and Google
returns `email_verified: true`, an `accounts` row is created against their **existing**
`users.id`. Every FK survives. The 3 password users use Google, having been told in advance.

**Verify continuously during the window:**
- `select count(*) from users where deleted_at is null` — **must stay 14**
- `select count(*) from users where clerk_id is null` — 0 until a genuinely new signup
- `newUserCallbackURL` instrumented: any *existing* user landing there means linking failed
- Orphan check: `journal_entries` with no matching user — must be 0

---

## Phase 3 — Cleanup (≥1 week after cutover)

- Drop `users.clerkId`
- Remove `@clerk/nextjs` and `svix` (`svix` existed only for the webhook)
- Clerk keys out of `lib/env.ts`, `lib/env.client.ts`, `.env.example`, `tests/setup.ts`.
  Also remove the four dead `NEXT_PUBLIC_CLERK_SIGN_*_URL` lines that were never read.
- **CSP in `next.config.ts`** gets strictly tighter — drop `*.clerk.accounts.dev`,
  `*.clerk.com`, `img.clerk.com`, and `worker-src blob:` (it was for Clerk's worker).
  Drop `challenges.cloudflare.com` **only if** we decline the captcha plugin (Risk 4).
  **Add `https://lh3.googleusercontent.com` to `img-src`** — Google avatars now land in
  `avatarUrl`, and would otherwise fail silently. Note this is an *addition* to a directive
  we are otherwise shrinking.
- The HSTS `includeSubDomains` comment explains itself in terms of the *Clerk* cookie being
  shared across subdomains. That reasoning is now **more** load-bearing, not less — it is
  our own cookie at the parent domain. Rewrite the comment, keep the header.
- Add session revocation to the admin mentor-rejection flow (Risk 6)
- Renames once stable: `getOrCreateDbUser` → `getSessionUser`; the `clerkId` parameter in
  `proxy.ts`'s role cache

---

## Phase 4 — Email/password (blocked)

**Prerequisite: a working email provider, verified by a real send from production.**

Then wire `sendResetPassword` and `sendVerificationEmail` to the existing `sendMail`,
**not awaited** (`void sendMail(...)`) — per Better Auth's timing-attack guidance and
because nodemailer SMTP is slow.

Also harden `lib/email.ts`: today an unset SMTP config logs and returns a *success* shape.
For password reset that means the UI says "check your email" and nothing ever arrives.
Make it throw in production when no transporter exists.

Start with `requireEmailVerification: false`. Flip it to true only after a week of green
sends — with it on and SMTP broken, every new signup **and** the 3 password users are
locked out.

---

## Risks

1. **Neon HTTP transactions.** The one that can make this not work at all. Phase 0.2.
2. **Cookie domain.** Sessions must be shared across apex, `app.*` and `admin.*`.
   Production is straightforward; **dev is awkward** — `.localhost` behaviour varies by
   browser (fallback: `lvh.me`). Three loop conditions to defend: an unset cookie domain
   (**make it a hard boot failure in production** — this single guard is the most important
   line in the migration); `/api/auth/*` accidentally gated (make the bypass explicit and
   first); and a sign-in page that redirects an already-signed-in user into a cycle.
3. **Account linking is the migration.** Three defences: lowercase every email in the
   Phase 1 backfill; the `create.before` guard that makes a split account *impossible*
   rather than merely detectable; and `newUserCallbackURL` as an alarm.
4. **We delete two controls Clerk gave us free** — Turnstile bot protection and rate
   limiting on credential endpoints. Better Auth's default rate limiter is **in-memory**,
   which on Vercel is per-instance and close to useless; use `storage: "database"`. A public
   `/api/auth/sign-in/email` with neither, on a platform holding safeguarding records about
   minors, is a real regression.
5. **`cookieCache` is load-bearing, not an optimisation.** Without it every server action
   gains a Neon round-trip on metered mobile data. But it is stale by up to `maxAge`, so
   **never authorize off it** — a mentor rejected mid-incident would keep access for the
   cache window.
6. **We lose remote session revocation.** Clerk's dashboard could force-sign-out a user;
   nothing replaces it. That is a safeguarding capability, not a nicety.
7. **`getDbUser()` must start filtering `deletedAt`** — see Phase 2.

### Rollback

Phase 1 is purely additive and Clerk stays installed through Phase 2, so either reverts with
one `git revert`. Keep the Clerk application live and unpaused for 30 days; keep `clerk_id`
for at least a month; take a Neon branch snapshot immediately before cutover.

Even a partial cutover self-heals: users created by Better Auth during the window have
`clerk_id IS NULL`, and a reverted `getOrCreateDbUser` picks them up by email on next
sign-in with its three guards intact.

**Triggers:** user count ≠ 14, an admin locked out, a redirect loop on any surface, or
`/api/auth/*` 5xx above baseline.

---

## Testing

The existing 45 tests are pure-function with no database and no session, but they can still
catch the two bugs that would hurt most:

- **`tests/auth-schema.test.ts`** — imports `db/schema.ts` only. Asserts the JS property
  keys the adapter indexes exist; that `clerk_id` is nullable and `email` has a unique
  index; that new `userId` columns are `uuid` not `text`; and that no new column name
  contains an uppercase character, which locks in the `casing` fix permanently.
- **`tests/auth-config.test.ts`** — asserts on the options object. Most important:
  `user.additionalFields.role.input === false`, because a regression there is privilege
  escalation through a signup body. Also that `nextCookies()` is last, and that implicit
  linking is not disabled.
- **`tests/no-clerk.test.ts`** — walks the source asserting zero `@clerk` / `clerkId`
  matches. Cheap, and it is what stops a future merge reintroducing one.

**The real safety net is a manual staging pass** on staging hostnames and a cloned Neon
branch:

1. Google sign-in on `app.*`, then navigate straight to `admin.*` — loads with no second
   sign-in. *This proves the cookie domain.*
2. Signed-out user hits `admin.*/anything` — exactly one redirect. Check the network tab
   for a chain, not just the final page.
3. Non-admin hits `admin.*` — `/admin/unauthorized` renders **in place, URL unchanged**.
4. Seeded user with FK children signs in with Google — count unchanged, `accounts` row
   against the **existing** id, journal entries still visible.
5. Signup with an existing email — refused by the hook, no duplicate.
6. Revoke a mentor's `verified_at` while signed in — next action refused **immediately**,
   not after the cache expires.
7. Purge a seeded account — sessions and accounts gone, sign-in impossible,
   `safety_reports` FK intact.
8. Offline journal: queue an entry and sync it; confirm a v2-era queue is *dropped*.

---

## Delivery

| PR | Contents | Risk |
|---|---|---|
| 1 | `drizzle.config.ts` casing fix, schema, backfill, `lib/auth.ts`, route mount, client | None — invisible; let it sit 24h |
| 2 | Cutover: db-user, 33 auth sites, proxy, screens, purge, IndexedDB bump, delete webhook | High — **must be atomic** |
| 3 | Cleanup: drop `clerkId`, CSP, remove deps | Low — ≥1 week later |
| 4 | Email/password | Blocked on an email provider |

Deploy PR 2 in Sierra Leone's low-traffic window with both admins present and signed out.
Keep `@clerk/nextjs` and `svix` in `package.json` through PR 2 — removing them buys nothing
and costs the one-revert rollback.

Per repo convention: branches are kept after merge, and commits carry no co-author trailers.

---

## Open questions

- Does the Drizzle adapter need `transaction: false` on Neon HTTP, and does that option
  exist in the installed version? (Phase 0.2)
- Which `fields` direction does the installed version want? (Phase 0.2)
- Can a user with no `accounts` row reset a password? (Phase 0.2 — decides whether the
  3 password users have any route in besides Google)
- Do we keep Turnstile via Better Auth's captcha plugin, or accept the regression? (Risk 4)
- Which email provider? (Phase 4)


An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.


// USTAS 
Purchaser Account 
Recieving Account 

two decimal place 
error insteaad of flight 

//mandate 
reduce verbosity

//future references
add other demo list 
guma 
salwaco 


//aggregator side 
no rounding of tax 
make reference 16 digits

remove awaiting credit 

proper dashboard 
make statement the main dashboard
monthly, today,all time 
failure 
download all to pdf 
audititability, 
process == failed 

//edsa 
gross in all banks  and a drop down to choose a bank 
change to payment successful

// tax - add total purchase value and hold unto to it on the 15 
// tax - inactive until the 15 of every month  and a count down 
remove reconliation and exception 
remove the add a collegue 
and to add a user is an admin thing 
notification == only email and sms using apphive 

call it utility bulk payment system 
add 

add main dashboard pages on all the services 
daily, weekly, monthly and yearly

nra 
bulk prepaid 
and postpaid
master dashboard = prepaid + postpaid

Error: Link must be an in-app path starting with /
    at m (.next/server/chunks/ssr/[root-of-the-server]__1ohveo_._.js:1:16229) {
  digest: '2542784498'
}