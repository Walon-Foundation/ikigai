# Working in this repository

One repository, three projects. **Each has its own `AGENTS.md`, and it is the
authoritative one for code inside that directory. Read it before writing any
code there.**

| Directory | Stack | Its guide |
|---|---|---|
| `api/` | NestJS 12 | [api/AGENTS.md](./api/AGENTS.md) |
| `client/` | Next.js 16 | [client/AGENTS.md](./client/AGENTS.md) |
| `mobile/` | Expo SDK 57 | [mobile/AGENTS.md](./mobile/AGENTS.md) |

All three are on versions with breaking changes from what you likely know.
Assume your training data is wrong about them and read the versioned docs.

## Toolchain

**bun for everything** — install, run, test, scripts. Not npm, not pnpm, not yarn.

There is no workspace root. Each project has its own `package.json`, its own
`bun.lock` and its own `node_modules`; `bun install` is run inside each.

## Branching

`main` is left untouched during the re-architecture. Work branches off `dev`,
is built as **multiple focused commits**, is pushed to origin, opened as a PR
and merged into `dev`, then `dev` is pulled. Do the whole cycle for every
change. Branches are kept, locally and on origin. Never commit to `main`;
`dev` merges to `main` only on explicit say-so.

## Where the re-architecture stands

| Plan | Track | Status |
|---|---|---|
| [00](./docs/00-overview.md) | Overview, repo layout, order of work | **Done** |
| [01](./docs/01-api-server.md) | NestJS API | **Done** — every module, route and service ported (107 REST endpoints + one Socket.IO gateway for chat and notifications), R2 uploads, tests |
| [02](./docs/02-auth.md) | Clerk → Better Auth | **Next.** Better Auth is mounted in the API (`/api/auth/*`, `/me`, socket), but 18 controllers still use the transitional `InternalAuthGuard` and the client still uses Clerk |
| [03](./docs/03-mobile.md) | Expo app | **Done** as screens — every PWA screen rebuilt in the brand design, running on a device, on **demo data** (`mobile/src/data/demo.ts`). Wiring to the API waits on 02 |
| [04](./docs/04-web-redesign.md) | Marketing + admin redesign | Not started |

Deliberately deferred, not forgotten: cron scheduling and AWS EC2 deployment
(nginx must pass WebSocket upgrade headers), the iOS SwiftUI / Liquid Glass
version of the app.

`client/` is only changed when a plan says so — the API was built without
touching it, and it still runs the product on Clerk.

## Before planning work

Read [docs/00-overview.md](./docs/00-overview.md). The four migration tracks
depend on each other in a specific order, and the per-track plans in `docs/`
say what is already decided. The status table above is newer than the
`Status:` lines inside the plans. `docs/archive/` is superseded material kept
for reference — do not plan against it.
