# PWA Redesign — Mechanics Design

**Date:** 2026-06-05
**Extends:** `2026-06-04-pwa-architecture.md`
**Status:** Approved (build)

Adds the live mechanics on top of the existing PWA scaffold: mentor→mentee task
assignment, a growth tree driven by task outcomes, similarity-based matching with
a two-mentee cap per mentor, and parent↔child linking gated by the child's
in-app consent. Payments (Monime) are a separate, future spec.

## Data model

New Drizzle tables in `db/schema.ts`.

### `tasks`
A unit of work a mentor assigns inside a mentorship.

| field | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `mentorshipId` | uuid → mentorships.id | the mentor↔mentee pair |
| `title` | text not null | |
| `description` | text | the advice / detail |
| `status` | text default `assigned` | `assigned` · `completed` · `failed` |
| `growthPoints` | int default 10 | awarded to the tree on completion |
| `dueDate` | timestamp nullable | display only; never auto-fails |
| `completedAt` / `failedAt` | timestamp | |
| `createdAt` | timestamp | |

### `growthTrees`
One stateful tree per mentee.

| field | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid → users.id, unique | the mentee |
| `health` | int default 100 | 0–100; the wilt/recover dial |
| `growthPoints` | int default 0 | cumulative; never decreases |
| `stage` | int default 1 | derived from points; stored for cheap reads |
| `updatedAt` / `createdAt` | timestamp | |

Rule: **stage is permanent growth, health is transient.** A failed task drops
`health` (−20). A completed task raises `health` (+10, capped 100) and adds
`growthPoints`. The plant wilts when neglected but never shrinks below the size
it earned. Stage thresholds (points): 0 Seed · 30 Sprout · 80 Sapling · 150
Young Tree · 250 Flourishing.

### `guardianLinks`
Parent↔child relationship gated by consent.

| field | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `parentId` | uuid → users.id | requesting guardian |
| `childId` | uuid → users.id, nullable | set once the child exists/claims |
| `childEmail` | text | target when no account yet |
| `inviteCode` | text unique nullable | no-account flow |
| `relationship` | text | `parent` · `guardian` · `other` |
| `status` | text default `pending` | `pending` · `accepted` · `declined` |
| `respondedAt` / `createdAt` | timestamp | |

The parent sees nothing about the child until `status = accepted`.

### `mentorships` (extend)
Status values: `requested` · `active` · `declined` · `closed` (was
`icebreaker` etc.). `matchScore` = interest-tag overlap (0–100). A mentor holds
at most **2** `active` mentorships — enforced in the accept action.

## Flows

**Matching.** Mentee browses mentors on `/mentorship`, each shown with a real
match score (shared interest tags ÷ mentee tags). Requesting creates a
`requested` mentorship. The mentor sees pending requests in `/mentor-portal` and
accepts (→ `active`, if under the 2-cap) or declines (→ `declined`). Chat and
tasks unlock only when `active`.

**Tasks + tree.** On a mentee's detail page the mentor assigns tasks (title +
advice). The mentor marks each `completed` or `failed`. Completion grows the
tree (points + health); failure wilts it (health). The mentee sees their tasks
and tree on `/journey` and the dashboard.

**Consent linking.** A parent links by the child's email. If the child has an
account, a `pending` guardianLink is created and the child sees an accept/decline
prompt on their dashboard and settings. If not, an invite code is issued. Only
after the child accepts does the parent portal show the child's mentor, growth,
and progress.

## UI wiring
- **mentee dashboard / journey** — tree reflects `growthTrees` (stage→branches,
  health→vitality); active tasks listed; pending guardian request banner.
- **mentor portal** — pending requests to accept/decline; per-mentee task board.
- **parent portal** — child's growth + mentor (post-consent); payments deferred.
- **nav/sidebar/dashboards** — no emojis; lucide icons throughout.

## Out of scope
Payments/Monime, AI matching, push delivery, mentor marketplace pricing logic,
in-person verification.
