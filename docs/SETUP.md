# Local Development Setup

One repository, three projects. Each installs and runs independently — there is
no workspace root, so `bun install` is run inside each directory you intend to
work on.

## Prerequisites

- [Bun](https://bun.sh) >= 1.4
- A [Neon](https://neon.tech) Postgres project
- A [Clerk](https://clerk.com) application *(until the Better Auth migration lands — see [02-auth.md](./02-auth.md))*
- For `mobile/`: the [Expo Go](https://expo.dev/go) app, or an iOS Simulator / Android emulator

## 1. Clone

```bash
git clone git@github.com:Walon-Foundation/ikigai.git
cd ikigai
git checkout dev
```

`main` is left untouched during the re-architecture; `dev` is the active branch.

---

## 2. `client/` — marketing site + admin panel

```bash
cd client
bun install
cp .env.example .env    # then fill it in
```

`.env.example` documents every variable, which are required, and what each
optional one degrades to when unset. The required ones:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection string (pooled) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |

`lib/env.ts` validates these at boot and fails with a readable error rather
than an `undefined` deep inside a request.

### Database

The Drizzle schema lives at `client/db/schema.ts`. Push it:

```bash
bun run db:push      # answer No to any truncation prompt
bun run db:studio    # database GUI
```

### Run

```bash
bun run dev
```

Three surfaces, routed by hostname in `proxy.ts`. `*.localhost` resolves
natively, so no `/etc/hosts` editing is needed:

| URL | Surface |
|---|---|
| http://localhost:3000 | marketing site |
| http://admin.localhost:3000 | admin panel |
| http://app.localhost:3000 | the PWA |

Visiting `localhost:3000/admin` **redirects** to `admin.localhost:3000` — the
`/admin` prefix is never shown in the address bar. Use the subdomain directly.

### Granting admin access

There is no script for this yet. Set the role directly:

```sql
update users set role = 'admin' where email = 'you@example.com';
```

### Clerk webhook (local)

Expose the dev server with a tunnel (e.g. ngrok) and point a Clerk webhook at
`https://<tunnel>/api/webhooks/clerk`.

> **This endpoint has a live account-takeover bug** — it re-links accounts by
> email with none of the guards `lib/db-user.ts` has. It should be disabled in
> the Clerk dashboard. See [02-auth.md](./02-auth.md) Phase 0.

### Scripts

| Script | Purpose |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` / `start` | Production build / serve |
| `bun run lint` / `format` | Biome |
| `bun run test` | `bun test` with `tests/setup.ts` preloaded |
| `bun run db:push` | Push schema changes |
| `bun run db:generate` / `db:migrate` | Generate / run migrations |
| `bun run db:studio` | Drizzle Studio |

---

## 3. `api/` — NestJS server

```bash
cd api
bun install
bun run start:dev
```

| Script | Purpose |
|---|---|
| `bun run start:dev` | Watch-mode dev server |
| `bun run build` / `start:prod` | Build / run compiled output |
| `bun run lint` | oxlint (type-aware) |
| `bun run test` / `test:e2e` | vitest |

Note this project uses **oxlint and vitest**, not Biome and `bun test` — it is
the NestJS scaffold's toolchain, and differs from `client/`.

---

## 4. `mobile/` — Expo app

```bash
cd mobile
bun install
bun run start
```

Then press `i` for the iOS Simulator, `a` for an Android emulator, or scan the
QR code with Expo Go. `bun run web` runs the React Native Web build.

Routing is **expo-router** (file-based, under `src/app/`).

---

## 5. Which project do I need?

| Working on | Projects to run |
|---|---|
| Marketing or admin UI | `client/` |
| Mobile screens | `mobile/` + `api/` |
| API endpoints | `api/` (+ `client/` if the surface still calls server actions) |
| Anything touching the schema | whichever owns it — see [01-api-server.md](./01-api-server.md) |
