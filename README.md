# Ikigai

A purpose and mentorship platform for youth in Sierra Leone. Ikigai connects young people with verified mentors, supports journaling and self-discovery, and provides community safety tools.

---

## Repository layout

One repository, three deployables, one `dev` branch.

```
api/      NestJS 12      — the server. Owns business logic, data access and auth.
client/   Next.js 16     — the public marketing site and the admin panel.
mobile/   Expo SDK 57    — the React Native app for mentees, mentors and parents.
docs/                    — product, roadmap, setup and the migration plans.
```

Everything is built and run with **bun**. Each project installs its own
dependencies; there is no workspace root, so `bun install` is run inside
`api/`, `client/` and `mobile/` separately.

| | Install | Run |
|---|---|---|
| `api/` | `cd api && bun install` | `bun run start:dev` |
| `client/` | `cd client && bun install` | `bun run dev` |
| `mobile/` | `cd mobile && bun install` | `bun run start` |

Full instructions, including environment variables and the database, are in
[docs/SETUP.md](./docs/SETUP.md).

## Where things are going

The platform is mid-way through a four-track re-architecture: the authenticated
product surface is moving out of Next.js into Expo, the API is moving into
NestJS, auth is moving from Clerk to Better Auth, and the remaining web surfaces
are being redesigned.

Read [docs/00-overview.md](./docs/00-overview.md) first — it sequences the four
tracks and explains which depends on which. The per-track plans:

| Plan | Track |
|---|---|
| [01-api-server.md](./docs/01-api-server.md) | NestJS server, and the move off server actions |
| [02-auth.md](./docs/02-auth.md) | Clerk → Better Auth |
| [03-mobile.md](./docs/03-mobile.md) | Expo app |
| [04-web-redesign.md](./docs/04-web-redesign.md) | Marketing + admin redesign |

## What it does

- **Mentorship** — matched mentor connections with in-app messaging
- **Journal** — private and mentor-visible journal entries with offline support
- **Growth Tree** — milestone-based visual progress tracker
- **Purpose Book** — the structured self-discovery artifact
- **Pad Her Power** — resource map and safety information for girls and young women
- **School Clubs** — club leads register and manage school Ikigai clubs
- **Admin panel** — mentor verification, school vetting, safeguarding, CMS, analytics

## Branching

`main` is the working deployable and is left alone during the re-architecture.
All work branches off `dev`, lands on `dev`, and `dev` merges to `main` only
once the whole migration is working.

```
main ─────────────────────────────────────────────  (untouched)
 └── dev ───────────────────────────────────────── ◄ everything merges here
      ├── feat/…
      ├── chore/…
      └── fix/…
```

Branches are pushed to origin and kept after merge.

## License

Proprietary — see [LICENSE](./LICENSE). All rights reserved.
Contributions: see [CONTRIBUTING.md](./CONTRIBUTING.md).
