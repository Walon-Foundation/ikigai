# 01 — The NestJS server

**Status:** planning. **Depends on:** nothing. **Blocks:** [03-mobile.md](./03-mobile.md).

Moving business logic out of Next.js server actions and route handlers into a
modular NestJS server, so that the Expo app and the web client share one
implementation.

---

## What is actually being moved

Not "the API routes". There are only 10 route handlers. The real surface is
**118 exported server actions across 45 files**:

| Where | Actions | Moves? |
|---|---|---|
| `app/(pwa)/` — the product surface | 54 | **Yes.** Mobile cannot call a server action. |
| `app/admin/` | 63 | Last, or never — see below. |
| `app/(marketing)/` | 1 (`submitEnquiry`) | With the CMS, if ever. |

Plus the 10 route handlers:

| Route | Verbs | Destination |
|---|---|---|
| `/api/match` | GET | `MatchingModule` |
| `/api/messages`, `/api/messages/[mentorshipId]` | POST, GET | `MessagingModule` |
| `/api/notifications` | GET, PATCH | `NotificationsModule` |
| `/api/push/resubscribe` | POST | `NotificationsModule` |
| `/api/me/export` | GET | `AccountModule` |
| `/api/uploadthing` | — | `UploadsModule` |
| `/api/cron/notifications` | GET | `JobsModule` |
| `/api/cron/purge-accounts` | GET | `JobsModule` |
| `/api/webhooks/clerk` | POST | **Deleted** — see [02-auth.md](./02-auth.md) |

## Should admin move?

**Recommendation: no, not in this migration.**

63 of the 118 actions are admin. They work well as server actions with
`revalidatePath`, the admin panel is not bandwidth-constrained, and mobile does
not need any of them. Moving them buys consistency and costs the largest single
block of work in the plan. It is the cheapest scope to cut, and cutting it is
what makes the rest achievable.

Revisit once the product surface is done.

---

## Who owns the database

**This blocks everything else in this document. Settle it first.**

48 tables at `client/db/schema.ts`. Both projects need it during the
transition: `client/` because marketing and admin read the CMS directly,
`api/` because it is becoming the owner.

The tsconfig-path-alias approach this document originally recommended was
spiked on 16 September 2026 and **does not work**. Turbopack bundles the
cross-project import without complaint, but TypeScript rejects it: two copies
of `drizzle-orm` are two nominal identities even at identical versions,
because `Column` carries a `protected` member. One shared copy typechecks
cleanly; two do not.

The decision and its two options are recorded in
[00-overview.md](./00-overview.md#who-owns-the-database) — a bun workspace
root, or `client/` giving up direct database access entirely. **Until it is
made, no module below can be ported.**

Whatever is chosen, **the schema is defined once.** A second copy is not a
fallback; it is the end of the migration.

Fix `drizzle.config.ts` before any schema work either way: it omits the
`casing: "snake_case"` that `db/db.ts` sets. Invisible today because every
column has an explicit SQL name, and silent breakage the first time a new
column relies on the default.

## Module layout

One module per domain area, each owning its controller, service and DTOs.

**Infrastructure**

| Module | Absorbs |
|---|---|
| `DatabaseModule` | `db/db.ts` — the Drizzle client, provided for injection |
| `AuthModule` | Better Auth handler + the guard. See [02-auth.md](./02-auth.md) |
| `NotificationsModule` | `lib/notifications/*` — 7 files, the 39-key catalog, dispatch, transport, jobs |
| `MailModule` | `lib/email.ts`, `lib/email/templates.ts` |
| `UploadsModule` | `lib/uploads.ts`, `lib/uploadthing.ts`, the UploadThing router |
| `JobsModule` | `lib/purge.ts`, the two cron entrypoints |

**Domain** — the 54 product actions

| Module | Actions | From |
|---|---|---|
| `OnboardingModule` | 9 | `onboarding/actions.ts` |
| `MentorshipModule` | 10 | `mentor-portal/actions.ts` (7), `requestMentor`, `verifyMeeting`, `submitMentorReview` |
| `TasksModule` | 8 | `curriculum-actions.ts` (5), `task-actions.ts` (3) |
| `SkillsModule` | 3 | `submitMilestone`, `approveMilestone`, `requestRevision` |
| `JournalModule` | 3 | `saveJournalEntry`, `addJournalFeedback`, `getSharedJournals` |
| `GoalsModule` | 3 | `goals/actions.ts` |
| `GroupsModule` | 3 | `groups/actions.ts` |
| `EventsModule` | 3 | `activities/actions.ts` — rsvp, cancel, check-in |
| `GuardiansModule` | 2 | `guardian-actions.ts` |
| `SafetyModule` | 2 | `safety/actions.ts` |
| `PurposeBookModule` | 1 | `saveLifeVision` |
| `AccountModule` | 7 | `settings/actions.ts` (5), `deletion-actions.ts` (2) |
| `MessagingModule` | — | the two message routes |
| `MatchingModule` | — | `lib/match.ts`, the match route |

### What `lib/` becomes

Most of it is already framework-free and moves close to as-is:

| Source | Lines | Destination |
|---|---|---|
| `lib/skill-tracks.ts` | 469 | `SkillsModule` service |
| `lib/notifications/*` | ~2,000 | `NotificationsModule` |
| `lib/clubs.ts` | 257 | `ClubsModule` |
| `lib/purge.ts` | 260 | `JobsModule` |
| `lib/mentorship.ts` | 227 | `MentorshipModule` |
| `lib/tasks.ts` | 146 | `TasksModule` |
| `lib/journal.ts` | 121 | `JournalModule` |
| `lib/match.ts`, `skill-stages.ts`, `growth*.ts`, `progress.ts` | pure | move verbatim; they have no I/O |
| `lib/db-user.ts` | 223 | **deleted** — replaced by the auth guard |
| `lib/cms*.ts` | 648 | **stays in client** unless admin moves |
| `lib/offline-journal.ts`, `push-client.ts`, `use-pwa-install.ts` | — | **stay in client** — browser-only |

The pure modules are the easy win: `lib/match.ts`, `lib/skill-stages.ts` and
friends have no database access and are already unit-tested. Move them first
and the tests come with them.

---

## The pattern that matters

The PWA is staying ([00-overview.md](./00-overview.md)). So each action moves
**once**, into the API, and the existing server action becomes a caller:

```ts
// client — app/(pwa)/(app)/goals/actions.ts   AFTER
"use server";

export async function addGoal(formData: FormData) {
  const res = await apiFetch("/goals", {
    method: "POST",
    body: { title: formData.get("title") },
  });
  revalidatePath("/goals");
  return res;
}
```

It keeps the `"use server"` directive, the progressive-enhancement form target
and the `revalidatePath`. It loses only the business logic, which now lives in
one place that mobile can also reach.

**If a ported action keeps its logic instead of delegating, the migration has
failed silently.** That is the single rule this document exists to enforce.

`apiFetch` — one helper in `client/lib/api.ts`, forwarding the session cookie
and normalising errors — should be written before the first port, not after
the third.

---

## Conventions

- **Validation is zod.** The codebase already uses it (`lib/env.ts`, every
  action). Do **not** introduce class-validator; two validation libraries in
  one server is a tax paid forever.
- **One DTO per endpoint**, exported, so `client/` and `mobile/` can import the
  inferred type rather than restating the shape.
- **Errors**: a single filter mapping domain failures to a consistent JSON
  shape. Server actions today return `{ error }` objects that the forms render
  inline — preserve that shape so the client's error rendering does not need
  rewriting.
- **Auth**: a guard, not a per-handler check. The current code calls `auth()`
  then re-queries the user in 33 places; the guard does it once and attaches
  the user to the request.
- **Neon HTTP has no interactive transactions** — `db.transaction()` throws.
  Multi-write operations need either a second Drizzle client on
  `neon-serverless` (WebSocket) or explicit compensating logic. Decide per
  module; do not discover it at runtime.
- **Indexes are paired to queries** on purpose (`db/schema.ts` opens with the
  reasoning). Every new query gets the same treatment — over Neon's HTTP driver
  each statement is a network round-trip, so a sequential scan costs
  wall-clock time on every request.

---

## Order

Each step ships to `dev` working: endpoint built, client action repointed,
tests green. Not a big branch.

| # | Module | Why here |
|---|---|---|
| 1 | `GoalsModule` (3) | Smallest self-contained domain. This is the pattern-setter — `apiFetch`, the guard, the error shape and the DTO convention all get settled on three trivial actions rather than on the mentorship core. |
| 2 | `AccountModule` (7) | Settings and deletion. Touches push subscriptions, which mobile needs early. |
| 3 | `JournalModule` (3) | Offline sync is the hardest mobile problem; start learning it early. |
| 4 | `OnboardingModule` (9) | Mobile needs it to have any user at all. |
| 5 | `MentorshipModule` + `TasksModule` (18) | The core loop. The largest and most intricate; do it once the conventions are proven. |
| 6 | `SkillsModule` (3) | Journey / growth tree. |
| 7 | `GroupsModule`, `EventsModule`, `GuardiansModule`, `PurposeBookModule` (9) | Independent, parallelisable. |
| 8 | `SafetyModule` (2) | Small but safeguarding-critical. Port deliberately, not opportunistically, and not half-way. |
| 9 | `MessagingModule`, `MatchingModule`, `NotificationsModule` | The route handlers. |
| 10 | `JobsModule` | Needs the deployment question answered first. |

## Open questions

- **Where is the API deployed, and what runs the crons?** Two jobs are on
  Vercel Cron today (`client/vercel.json`), one of which deletes accounts.
  Moving them needs a scheduler wherever the API lands.
- **Does `client/` keep querying the database directly** for marketing and
  admin, or does everything eventually go through the API? The recommendation
  above assumes yes, it keeps querying.
- **CORS and cookies** between the web client's origin and the API's. Coupled
  to the cookie-domain decision in [02-auth.md](./02-auth.md) — settle them
  together, not separately.
- **Push** is web-push today. Mobile needs its own delivery path, and the two
  must share the 39-key catalog rather than fork it.
