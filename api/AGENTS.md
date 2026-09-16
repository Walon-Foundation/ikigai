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
- The database is Neon Postgres via **Drizzle**. The schema is the one in
  `client/db/schema.ts` today; see the plan for how it becomes shared.
- Neon's HTTP driver has **no interactive transactions** — `db.transaction()`
  throws. This constrains auth and any multi-write operation; see
  [../docs/02-auth.md](../docs/02-auth.md).
