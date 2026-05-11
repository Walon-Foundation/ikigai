# Local Development Setup

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Node.js >= 20 (for type-checking tooling)
- A [Neon](https://neon.tech) Postgres project
- A [Clerk](https://clerk.com) application

## 1. Clone and install

```bash
git clone <repo-url>
cd ikigai
bun install
```

## 2. Environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard → Webhooks → your endpoint |
| `DATABASE_URL` | Neon dashboard → Connection string (pooled) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Set to `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Set to `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Set to `/onboarding` |

## 3. Database

Push the schema to your Neon database:

```bash
bun run db:push
```

Answer **No** when Drizzle asks about truncating existing tables.

To open Drizzle Studio (database GUI):

```bash
bun run db:studio
```

## 4. Start the dev server

```bash
bun run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## 5. Admin panel

The admin panel is served on a separate subdomain in production (`admin.yourdomain.com`).
Locally, it is accessible at `http://localhost:3000/admin`.

To grant admin access to a user account:

```bash
bun scripts/make-admin.ts user@example.com
```

## 6. Clerk webhook (local)

To receive Clerk user-created events locally, expose your dev server with a tunnelling tool (e.g. [ngrok](https://ngrok.com)) and point a Clerk webhook endpoint at `https://<tunnel>/api/webhooks/clerk`.

## Available scripts

| Script | Purpose |
|---|---|
| `bun run dev` | Start Next.js dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run Biome linter |
| `bun run format` | Auto-format with Biome |
| `bun run db:push` | Push schema changes to database |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:generate` | Generate a new migration file |
| `bun run db:studio` | Open Drizzle Studio |
