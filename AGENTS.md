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
is built as **multiple focused commits**, is pushed to origin, and merges into
`dev`. Never commit to `main`; `dev` merges to `main` only on explicit say-so.

## Before planning work

Read [docs/00-overview.md](./docs/00-overview.md). The four migration tracks
depend on each other in a specific order, and the per-track plans in `docs/`
say what is already decided. `docs/archive/` is superseded material kept for
reference — do not plan against it.
