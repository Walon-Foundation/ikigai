# Ikigai

A purpose and mentorship platform for youth in Sierra Leone. Ikigai connects young people with verified mentors, supports journaling and self-discovery, and provides community safety tools — built as a progressive web app optimised for low-bandwidth environments.

---

## What it does

- **Mentorship** — AI-matched mentor connections with in-app messaging
- **Journal** — private and mentor-visible journal entries with offline support
- **Pad Her Power** — resource map and safety information for girls and young women
- **School Clubs** — club leads can register and manage school ikigai clubs
- **Growth Tree** — milestone-based visual progress tracker
- **Admin panel** — separate subdomain (`admin.*`) for platform management

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth | Clerk v7 |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS v4 |
| PWA | Service worker + Web App Manifest |
| Linting | Biome |

## Project structure

```
app/
  (app)/          — authenticated user-facing pages
  admin/          — admin panel (subdomain-routed)
  api/            — API routes
  onboarding/     — new-user onboarding flow
components/       — shared UI components
db/
  schema.ts       — Drizzle table definitions
  migrations/     — generated SQL migrations
lib/              — shared utilities
scripts/          — one-off admin scripts
public/           — static assets, icons, SW
```

## License

Proprietary — see [LICENSE](./LICENSE). All rights reserved.

## Setup

See [SETUP.md](./SETUP.md) for local development instructions.
