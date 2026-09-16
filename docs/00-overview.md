# Re-architecture overview

**Status:** planning. **Written:** 16 September 2026.

Ikigai is moving from a single Next.js application to three: a NestJS API, an
Expo mobile app, and a slimmer Next.js web client. Auth moves from Clerk to
Better Auth along the way, and the remaining web surfaces are redesigned.

Read this before the per-track plans. The tracks are **not** independent, and
the order they happen in is most of the risk.

---

## Where we are

```
api/      NestJS 12, ESM, oxlint + vitest       — scaffolded, empty
client/   Next.js 16, the existing application  — unchanged, fully working
mobile/   Expo SDK 57 + expo-router             — scaffolded, empty
docs/     this plan set
```

`client/` is the entire product today. Measured on this branch:

| | |
|---|---|
| Exported server actions | **118**, across 45 files |
| — in `app/(pwa)/` (the product surface) | 54 |
| — in `app/admin/` | 63 |
| — in `app/(marketing)/` | 1 |
| API route handlers | 10 |
| Database tables | 48, in `client/db/schema.ts` |
| Files importing Clerk | 31 |
| PWA files / client components | 104 / 54 |
| Notification types in the catalog | 39 |

## Target

```
            ┌──────────────┐
            │  mobile/     │  Expo — mentees, mentors, parents, club leads
            └──────┬───────┘
                   │ HTTP + Better Auth session
            ┌──────▼───────┐
            │  api/        │  NestJS — business logic, data access, auth
            └──────┬───────┘
                   │ Drizzle
            ┌──────▼───────┐        ┌──────────────┐
            │ Neon Postgres│◄───────┤  client/     │  Next.js — marketing, admin
            └──────────────┘  (see  └──────────────┘
                              "Who owns the database" below)
```

`api/` is the single auth origin. Mobile uses Better Auth's Expo plugin, the
web client and the admin panel use the same auth server.

---

## The one thing that makes this hard

**Expo cannot call a server action.** The product surface is 54 server actions
plus React Server Components, and none of that mechanism exists in React
Native. Every one of those 54 has to become an HTTP endpoint before the screen
that calls it can be ported.

So "move the PWA into Expo" is not a port of 104 files. It is:

1. build the endpoint in `api/`,
2. rebuild the screen in `mobile/` against it,
3. and — because the PWA is staying — repoint the existing server action at the
   same endpoint so both clients share one implementation.

Step 3 is what stops this becoming two codebases that drift. A server action
that becomes a thin `fetch` to `api/` keeps its progressive-enhancement form
and its `revalidatePath`, and loses only the business logic, which has moved.

## The PWA is not being deleted

Decided: **Expo becomes the primary client, and `app/(pwa)/` keeps working.**

`PRODUCT.md` names low-bandwidth, offline-first and installable as binding
constraints for an audience in Freetown and the Western Rural Area on metered
mobile data. A Play Store install is a real data and storage cost, and not
every user can pay it. The web PWA stays as the route in for those users.

The cost is honest and should be stated: two clients, indefinitely. That cost
is only bearable because of step 3 above — they must share one API, or this
decision becomes untenable within a quarter.

---

## Order of work

```
Track R  redesign ════════════════════════════════════════════►  (parallel, independent)

Phase 1  ──► Phase 2  ──► Phase 3  ──────► Phase 4
API          auth         port the         mobile
skeleton     cutover      modules          screens
```

### Phase 1 — API skeleton
NestJS wired to the database, one module ported end-to-end to establish the
pattern, and the client's corresponding server action repointed at it. Nothing
user-visible. See [01-api-server.md](./01-api-server.md).

### Phase 2 — Auth cutover
Clerk out, Better Auth in, mounted in `api/`. Done **early and deliberately**:
31 files import Clerk, and porting 118 actions against Clerk first would mean
rewriting every one of them again afterwards. Doing auth second means every
port after it is written against the final auth model, once.

This phase is **atomic** on the client — a page rendering under Clerk cannot
call an action that reads a Better Auth session. See [02-auth.md](./02-auth.md).

### Phase 3 — Port the modules
The remaining server actions and route handlers move into Nest modules, domain
by domain, each with the client's action repointed in the same commit.

### Phase 4 — Mobile screens
Expo screens against a stable API. The heaviest track in raw volume, and the
least risky, because by this point nothing underneath it is still moving.

### Track R — Redesign
Marketing and admin, running alongside all of the above. It touches no
architecture and is the only track that produces something visible early. See
[04-web-redesign.md](./04-web-redesign.md).

**Do not run Phase 3 and Track R over the same admin files at the same time.**
That is the one collision in this plan; sequence admin redesign either well
before or well after its endpoints move.

---

## Open decisions

### Who owns the database

The schema is 48 tables at `client/db/schema.ts`. Both `api/` and `client/`
need it during the transition — `client/` because marketing and admin read the
CMS directly today. There is no workspace root, so they have separate
`node_modules` and separate tsconfigs.

**Recommended:** the schema moves to `api/src/db/schema.ts`, since the API owns
data. `client/` reaches it through a tsconfig path alias during the transition
and stops importing it entirely once admin moves behind the API. Both projects
install `drizzle-orm` — they would anyway.

**The alternative worth considering** is adding a bun workspace root after all
and a `packages/db`. It was declined at the layout decision, but cross-project
type sharing without one is the thing most likely to make that decision feel
wrong. Revisit if the path alias fights the bundler.

Not yet decided. It blocks Phase 1, so it is the first thing to settle.

### Does admin move behind the API

63 of the 118 actions are admin. They work well as server actions, and admin is
not bandwidth-constrained. Moving them buys consistency; leaving them buys time.

**Recommended:** leave admin on server actions through Phase 3, move it last or
never. Mobile does not need it, and it is the cheapest scope to cut.

### Still unanswered

- Where the API is deployed, and whether `client/` stays on Vercel
- Whether the two cron jobs (`vercel.json`) move to the API and what runs them
- Push notifications: the 39-key catalog is web-push today; Expo needs its own
  delivery path, and the two must share the catalog, not fork it

---

## Working rules

- **bun for everything.** No workspace root; `bun install` per project.
- **Branching:** `main` is untouched. Work branches off `dev`, is built as
  multiple focused commits, is pushed to origin, merges into `dev`. `dev`
  merges to `main` only when the whole migration works.
- **Read the versioned docs.** Next.js 16, NestJS 12 and Expo SDK 57 all differ
  from what a model's training data contains. Each project's `AGENTS.md` says
  where to look.
- `docs/archive/` is superseded. Do not plan against it.

## Standing risks

1. **Two clients, one API.** If a server action keeps its logic instead of
   delegating, the web and mobile products fork. This is the failure mode that
   ends the project, and it happens one convenient shortcut at a time.
2. **Neon HTTP has no interactive transactions.** `db.transaction()` throws.
   This constrains auth (see 02) and every multi-write operation the API grows.
3. **Scope.** 118 actions, 48 tables, 104 PWA files, three runtimes. Every
   phase above should ship to `dev` working, not accumulate.
4. **The safeguarding surfaces are not optional.** Guardian consent, mentor
   vetting and the safety report queue are load-bearing for a platform holding
   records about minors. They are not the first thing to port, and not a thing
   to leave half-ported.
