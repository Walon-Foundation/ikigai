# This is NOT the NestJS you know

NestJS 12 on bun, ESM (`"type": "module"`), with **oxlint** and **vitest** —
not ESLint and not Jest. Check `package.json` before reaching for a tool.

Read the docs at https://docs.nestjs.com before writing any code, and heed
deprecation notices. Assume your training data predates this version.

## Conventions

- **Modular**: one Nest module per domain area, each owning its controller,
  service and DTOs. The module boundaries are listed in
  [../docs/01-api-server.md](../docs/01-api-server.md) — follow them rather
  than inventing new ones.
- **bun** for everything: `bun install`, `bun run start:dev`, `bun run test`.
- Validation is **zod**, matching the rest of the codebase. Do not introduce
  class-validator.
- The database is Postgres via **Drizzle**, on the **node-postgres pool**
  (`src/db/db.ts`) — so `db.transaction()` works here, unlike the client's
  neon-http driver. Locally it is Docker (`bun run db:up`, port **5433**);
  production is Neon over TCP.
- **The schema is canonical in `src/db/schema.ts`.** `client/db/schema.ts` is a
  byte-identical copy: after changing it run `bun run schema:sync`, and
  `bun run schema:check` must pass. Never let drizzle-kit drop or truncate
  data — alter columns by hand instead.
- **Auth**: Better Auth lives in `src/auth/` (drizzle adapter keyed by model
  name, uuid ids, bearer plugin for Expo). `SessionGuard` is the real guard;
  `InternalAuthGuard` (`x-internal-token` + `x-user-id`) is transitional for
  the client proxy and goes away with [../docs/02-auth.md](../docs/02-auth.md).
- **Files** go to Cloudflare R2 (`src/uploads/`): presigned PUT, then a confirm
  call that HEAD-checks the object. Deleting data must delete its R2 objects.
- **Realtime** is one Socket.IO gateway (`src/realtime/`), authenticated in the
  handshake middleware, rooms `user:<id>` and `mentorship:<id>`. Services emit
  through `realtime.sink.ts`, which never throws.
- Notifications never throw either: a failed push must not fail the action
  that triggered it.
- Env is validated with zod in `src/env.ts`; add every new variable there.
- Before pushing: `bun run lint`, `bun run test`, and `bunx tsc --noEmit`
  (clear `*.tsbuildinfo` first if errors look stale).
