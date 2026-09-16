# Ikigai PRD v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan phase-by-phase. This is a **master plan** spanning nine epics; each phase below should be expanded into bite-sized TDD tasks at execution time. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Ikigai Digital PRD v1.0 across the existing Next.js 16 PWA, excluding all AI features, taking the platform from "onboarding + admin" to a full mentorship product: structured discovery, purpose profile, a roadmap-driven growth tree, mentor marketplace, activities, in-person verification, richer communication, digital notebook, parent oversight, and a payment scaffold.

**Architecture:** Single Next.js 16 app, multi-tenant by subdomain (marketing / `app` / `admin`) via `proxy.ts`. Server Components for reads, validated server actions for writes, Drizzle ORM over Neon HTTP (stateless — no transactions; `db:push` for schema). Auth via Clerk; role gating via `requireRole`/`requireAdmin` in `lib/db-user.ts`. Progress is unified under a single **roadmap → growth-tree** model.

**Tech Stack:** Next.js 16.2.5, React 19, Clerk (`@clerk/nextjs` ^7), Drizzle ^0.45 + Neon HTTP, Tailwind v4 (oklch tokens), lucide-react, biome, bun. New dependency to be chosen in Phase 6: a file/media storage provider.

---

## Locked decisions (from PRD review, 2026-06-05)

1. **Roadmap drives the tree.** The growth tree is remapped to four phase-aligned stages (Seed → Sprout → Tree → Bloom). Completing roadmap-phase milestones is what grows the tree. One unified completion model.
2. **Discovery Assessment rebuilt** as the Ikigai 4-quadrant instrument (Love / Good-at / Community-needs / Opportunities) + Values + Personality, feeding a structured Purpose Profile and a **template-generated** (non-AI) Purpose Statement.
3. **Payments scaffolded**, gateway stubbed. Build data model + UI + invoices/history behind a `PaymentGateway` interface; the Monime call is a stub until credentials exist.
4. **Dependency-ordered delivery** (the phase order below).

## Explicitly excluded (no AI in this plan)

- §9 AI-powered matching → keep deterministic `lib/match.ts`; Phase 3 upgrades it to **weighted deterministic** scoring (still no ML/LLM).
- §14 AI safeguarding of conversations → keep the existing keyword-flag heuristic (`lib/journal.ts` style); surface flags to admins (already built).
- §26 AI Career Coach / scholarship matching / CV builder → out of scope (future).

## Existing foundation (do not rebuild)

- Onboarding shells for mentee/mentor/parent; role-branched resume logic in `app/(pwa)/(app)/layout.tsx`.
- Growth tree maths (`lib/growth.ts`, `components/growth-tree.tsx`), tasks, mentorships, guardian links.
- 1:1 messaging (`mentorship/[id]` + `/api/messages`), journal, safety module, pad-her-power.
- Admin suite: dashboard, users + role-adaptive detail, mentors verify, schools, reports, **events management**, **guardians**, **safeguarding**, **analytics** (active users, retention, completion, attendance, session freq, satisfaction), push notifications. (§22, §23 = done.)
- `requireRole` / `requireAdmin` gates; `/admin/unauthorized` terminal page; proxy subdomain routing.

## Cross-cutting conventions (apply to every task)

- **Read the Next docs first.** This is Next 16 — APIs differ. Check `node_modules/next/dist/docs/` before using a feature.
- **Validate every server action argument.** TS types are compile-time only; whitelist enums, cap string lengths, coerce numbers. Re-derive any safety-critical flag server-side (never trust the client).
- **Gate every page/action by role.** Mentee-only surfaces use `requireRole(["mentee"])`; admin uses `requireAdmin()`.
- **Schema changes** go in `db/schema.ts` then `bun run db:push` (no migration files in this repo). Use `snake_case` casing (configured in `db/db.ts`).
- After each task: `bun x tsc --noEmit`, `bun run lint`, and `bun run build` must pass. `bun run format` to fix style. Use `bun`, never `bunx` (use `bun x` for one-off binaries).
- Do **not** commit until the user says so.

---

## Phase 1 — Discovery Assessment & Purpose Profile (§7, §8, §21)

**Goal:** Replace the generic onboarding quiz with the Ikigai 4-quadrant Discovery Assessment, persist a structured Purpose Profile, generate a Purpose Statement (template-based), and expose the Purpose Book modules that read/write the same data.

**Schema (`db/schema.ts`):**
```ts
// Structured output of the discovery assessment. One row per user.
purposeProfiles = pgTable("purpose_profiles", {
  id, userId (unique, ref users.id),
  love: text[].array(),            // §7.1 interests/passions
  strengths: text[].array(),       // §7.2 skills
  communityNeeds: text[].array(),  // §7.3 problems they care about
  opportunities: text[].array(),   // §7.4 career directions
  values: text[].array(),          // §7.5 ranked
  personality: jsonb(),            // §7.6 four axes scores
  purposeStatement: text(),        // §8 generated
  goals: text[].array(),
  completedAt, updatedAt, createdAt,
})
```
Keep `users.interestTags` populated from `love`+`opportunities` for backward-compatible matching.

**Files:**
- Create `lib/assessment.ts` — quadrant question banks, value list, personality axes, `buildPurposeStatement(profile)` (deterministic template), `isComplete(profile)`.
- Create `lib/purpose-profile.ts` (server) — `getPurposeProfile(userId)`, `savePurposeProfile(...)`, upsert.
- Rewrite `app/(pwa)/(app)/onboarding/mentee/assessment/page.tsx` (+ a stepper client) into 4 quadrant steps.
- Keep/adjust `onboarding/mentee/values/page.tsx`, `onboarding/mentee/personality/page.tsx` to write into `purposeProfiles`.
- Update `app/(pwa)/(app)/onboarding/mentee/profile/page.tsx` to show the generated Purpose Statement for confirmation.
- Create `app/(pwa)/(app)/purpose-book/page.tsx` (§21) — modules (Who Am I / What I Love / Good At / World Needs / Opportunities / Purpose Statement / Life Vision) reading `purposeProfiles`; editable, autosaves.
- Update `lib/constants.ts` — move/extend question content into `lib/assessment.ts`; deprecate `QUIZ_QUESTIONS`.
- Update `app/(pwa)/(app)/layout.tsx` resume logic: mentee onboarding completion now keys off `purposeProfiles.completedAt`.
- Add nav entry for Purpose Book in `components/app-sidebar.tsx` + `components/app-nav.tsx` (mentee).

**Tasks:**
- [ ] Add `purposeProfiles` to schema; `db:push`; verify with a read.
- [ ] Build `lib/assessment.ts` (content + `buildPurposeStatement` + unit tests for the statement template).
- [ ] Build `lib/purpose-profile.ts` upsert helpers.
- [ ] Rewrite mentee assessment into 4 quadrant steps writing to the profile.
- [ ] Wire values + personality steps into the profile; render Purpose Statement on the profile step.
- [ ] Build the Purpose Book page (read/write modules, autosave server action with validation).
- [ ] Update onboarding resume gate + sidebars/nav; backfill `interestTags`.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** A new mentee completes all quadrants → `purposeProfiles` row with a non-empty `purposeStatement`; Purpose Book renders and persists edits; matching still works off `interestTags`.

---

## Phase 2 — Roadmap, Progress & Growth Tree (§11, §12, §13)

**Goal:** Introduce the four-phase developmental roadmap, drive a unified completion %, remap the growth tree to 4 phase-aligned stages, and add badges/achievement history. Depends on Phase 1 (purpose data seeds Phase 1 of the roadmap).

**Schema:**
```ts
// Roadmap steps are config in code (lib/roadmap.ts), completion is data:
roadmapProgress = pgTable("roadmap_progress", {
  id, userId (ref), stepKey: text(),   // e.g. "finding.journaling"
  completedAt, source: text(),         // 'task' | 'journal' | 'session' | 'event' | 'assessment'
  unique(userId, stepKey),
})
badges = pgTable("badges", { id, key (unique), name, description, icon })
userBadges = pgTable("user_badges", { id, userId, badgeKey, awardedAt, unique(userId, badgeKey) })
```
`growthTrees` stays but `stage`/`STAGE_*` are remapped.

**Files:**
- Create `lib/roadmap.ts` — the 4 phases (`finding` / `building` / `discovering` / `creating`), each with focus areas + steps; `phaseForCompletion(pct)`, `completionPercent(completedKeys)`.
- Rewrite `lib/growth.ts` — 4 stages: `Seed`(Self-Discovery) → `Sprout`(Skill-Building) → `Tree`(Purpose) → `Bloom`(Impact); `stageForPhase(phase)`. Keep `health` dial for task wilt/recover.
- Update `components/growth-tree.tsx` for 4 named stages + phase label.
- Create `lib/badges.ts` — definitions + `awardBadge(userId, key)` (idempotent) + award rules.
- Create `lib/progress.ts` (server) — `recordStep(userId, stepKey, source)`, `getProgress(userId)` (completion %, phase, badges, history).
- Hook existing events into `recordStep`: task completion (`mentor-portal/actions.ts` / `lib/growth.ts` callers), journal create (`journal/actions.ts`), session/meeting verification (Phase 5), event check-in (Phase 4), assessment completion (Phase 1).
- Rewrite `app/(pwa)/(app)/journey/page.tsx` into the Roadmap view: 4 phases, per-phase focus areas + steps with completion, completion %, current tree stage, badges, achievement history.
- Surface completion % + stage on `dashboard/page.tsx`.

**Tasks:**
- [ ] Schema (`roadmap_progress`, `badges`, `user_badges`); `db:push`; seed badge rows.
- [ ] `lib/roadmap.ts` (+ tests for `completionPercent`, `phaseForCompletion`).
- [ ] Rewrite `lib/growth.ts` to 4 phase-aligned stages (+ tests); update growth-tree component.
- [ ] `lib/badges.ts` + `lib/progress.ts` (`recordStep` idempotent, validated).
- [ ] Wire `recordStep` into task/journal/assessment events (others wired in their phases).
- [ ] Rebuild `journey/page.tsx` as the roadmap; add dashboard completion %.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** Completing a task/journal advances a roadmap step and completion %; crossing a phase threshold advances the tree stage and awards a badge; achievement history lists awarded badges.

---

## Phase 3 — Mentor Marketplace (§10)

**Goal:** Let mentees and parents browse/filter mentors and view rich profiles with ratings and testimonials, alongside the existing recommendation flow. Upgrade matching to weighted (deterministic) scoring.

**Schema:**
```ts
// Extend users (mentor fields):
users += { location: text(), languages: text[].array(),
           certifications: text[].array(), yearsExperience: integer(),
           hourlyRate: integer(), ratingAvg: integer(), ratingCount: integer() }
mentorReviews = pgTable("mentor_reviews", {
  id, mentorId (ref), authorId (ref), rating: integer() /*1-5*/,
  comment: text(), createdAt, unique(mentorId, authorId),
})
```
(`hourlyRate` may already exist from mentor pricing onboarding — reuse if so.)

**Files:**
- Rewrite `lib/match.ts` → weighted criteria (Shared Interests 25 / Career 20 / Purpose 20 / Values 15 / Personality 10 / Availability 10) reading `purposeProfiles`; still pure + deterministic; returns score + breakdown (shared interests/goals/values, growth areas).
- Create `app/(pwa)/(app)/mentors/page.tsx` — marketplace: filters (industry, skills, location, language, price, rating, availability), mentor cards.
- Create `app/(pwa)/(app)/mentors/[id]/page.tsx` — full mentor profile (bio, experience, certifications, testimonials, expertise, rating) + "Request mentorship" (respects `MENTOR_CAPACITY`).
- Update `mentorship/page.tsx` recommendations to show match score **breakdown** from the new `match.ts`.
- Create `mentor-reviews` server action (validated 1–5, one per author) + recompute `ratingAvg/Count`; surface a review prompt after a completed mentorship/graduation (Phase 5).
- Add mentor profile fields to `onboarding/mentor/profile/page.tsx`.
- Nav: add "Find a Mentor" (mentee) in sidebar/nav.

**Tasks:**
- [ ] Schema extensions + `mentor_reviews`; `db:push`.
- [ ] Weighted `lib/match.ts` (+ tests for each criterion and the blend).
- [ ] Marketplace list + filters (server-side filtering by query params).
- [ ] Mentor profile detail + request flow + capacity guard.
- [ ] Reviews action + rating recompute; show breakdown in recommendations.
- [ ] Extend mentor onboarding fields; nav entry.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** Mentee filters mentors and opens a profile with testimonials/rating; recommendations show a weighted breakdown; submitting a review updates the mentor's average.

---

## Phase 4 — Activity Hub & Finding Yourself Picnic (§16, §17)

**Goal:** User-facing events: browse, register/RSVP, reminders, check-in. Admin events already exist; add the participant side and the Picnic milestone unlocked at 50% roadmap completion.

**Schema:** reuse `events` + `eventAttendance`. Add:
```ts
events += { type: text() /* 'workshop'|'training'|'networking'|'wellness'|'camp'|'picnic' */,
            unlockAtPercent: integer() /* e.g. picnic = 50 */ }
eventAttendance += { checkedInAt: timestamp(), rsvpAt: timestamp() }
```

**Files:**
- Rewrite `app/(pwa)/(app)/activities/page.tsx` — upcoming/registered tabs, filters by type.
- Create `app/(pwa)/(app)/activities/[id]/page.tsx` is present → build it out: details, RSVP/register, capacity, check-in (button → records `checkedInAt`, calls `recordStep` for roadmap credit; QR/GPS check-in shares Phase 5 verification primitives).
- Create `activities/actions.ts` — `rsvp`, `cancelRsvp`, `checkIn` (validated; capacity enforced; idempotent).
- Picnic: gate registration on `getProgress(userId).percent >= event.unlockAtPercent`; show a locked state otherwise.
- Reminders: write `pushNotifications` rows on RSVP / day-before (cron or on-read; real push is best-effort via existing `send-push`).
- Admin events form (`events-client.tsx`): add `type` + `unlockAtPercent`.

**Tasks:**
- [ ] Schema deltas; `db:push`.
- [ ] Activities list + detail + RSVP/check-in actions (capacity, idempotency, validation).
- [ ] Roadmap credit on check-in via `recordStep`; Picnic unlock gating.
- [ ] Reminder notification rows; admin event-type/unlock fields.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** Mentee RSVPs and checks in → attendance + roadmap step recorded; Picnic is locked under 50% and registerable at/after 50%; admin sees attendance update (already built).

---

## Phase 5 — In-Person Meeting Verification (§18)

**Goal:** Three required physical meetings per mentorship (Introduction, Progress Review, Graduation), each verified by GPS check-in, QR code, or photo confirmation. Shares check-in primitives with Phase 4.

**Prerequisite/decision:** a media storage provider for photos (see Phase 6 storage decision — resolve before photo confirmation).

**Schema:**
```ts
meetingVerifications = pgTable("meeting_verifications", {
  id, mentorshipId (ref), meetingNumber: integer() /*1-3*/,
  method: text() /* 'gps'|'qr'|'photo' */,
  lat: text(), lng: text(),          // gps
  qrToken: text(),                   // one-time token issued per meeting
  photoUrl: text(),                  // storage URL
  verifiedAt, createdAt, unique(mentorshipId, meetingNumber),
})
```

**Files:**
- Create `lib/verification.ts` — QR token issue/verify, GPS distance check vs an event/meeting location, meeting labels.
- Create `app/(pwa)/(app)/mentorship/[id]/verify/page.tsx` — show the 3 meetings, status, and the verify affordance (mentor shows QR / mentee scans, or GPS/photo).
- Create `mentorship/[id]/verify/actions.ts` — `verifyMeeting` (validated method, idempotent per meetingNumber, records → `recordStep` "session"/graduation badge).
- Graduation (meeting 3) triggers the review prompt (Phase 3) and a completion badge.
- Surface meeting status in mentor-portal and parent-portal.

**Tasks:**
- [ ] Resolve storage provider; add upload util.
- [ ] Schema `meeting_verifications`; `db:push`.
- [ ] `lib/verification.ts` (QR + GPS, tested) + verify page + actions.
- [ ] Roadmap/badge hooks; graduation → review prompt.
- [ ] Surface in mentor + parent portals.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** Each of the 3 meetings can be verified once by GPS/QR/photo; meeting 3 awards the graduation badge and opens a mentor review.

---

## Phase 6 — Communication (§14, AI excluded)

**Goal:** Extend the existing 1:1 messaging with voice notes, file sharing, and group discussions. Keep the keyword-flag safeguarding heuristic and the existing admin flag surface (no AI).

**Storage decision (also unblocks Phase 5):** pick a provider — recommend **UploadThing** (simplest Next 16 fit) or S3-compatible (Cloudflare R2). Add `lib/storage.ts` wrapping uploads; store only URLs in the DB.

**Schema:**
```ts
messages += { attachmentUrl: text(), attachmentType: text() /* 'voice'|'file'|'image' */, groupId: uuid() }
groups = pgTable("groups", { id, name, createdBy, createdAt })
groupMembers = pgTable("group_members", { id, groupId, userId, unique(groupId, userId) })
```
A message belongs to either a `mentorshipId` (1:1) or a `groupId` (group).

**Files:**
- `lib/storage.ts` + upload route/action (validated MIME + size caps).
- Extend `/api/messages` + `mentorship/[id]` client to render/send voice notes (record via MediaRecorder), files, images.
- Create group surfaces: `app/(pwa)/(app)/groups/page.tsx`, `groups/[id]/page.tsx`, `groups/actions.ts` (create/join, post message).
- Keep keyword-flag check on message content server-side; existing admin safeguarding view already reads journal flags — extend it to message flags if desired (optional).

**Tasks:**
- [ ] Storage provider + `lib/storage.ts` + validated upload.
- [ ] Schema deltas; `db:push`.
- [ ] Voice/file/image in 1:1 messaging.
- [ ] Groups (create/join/post) with role checks.
- [ ] Server-side keyword flag on messages (no AI).
- [ ] `tsc` + `lint` + `build` green.

**Verification:** Users exchange voice/file/image messages 1:1 and in a group; oversized/wrong-type uploads are rejected; flagged content is recorded for admins.

---

## Phase 7 — Digital Notebook (§15)

**Goal:** Turn the journal into the full digital notebook: reflection prompts, gratitude entries, goal tracking, and mentor feedback — all part of the growth archive and feeding roadmap steps.

**Schema:**
```ts
journalEntries += { entryType: text() /* 'reflection'|'gratitude'|'goal'|'free' */, promptKey: text() }
goals = pgTable("goals", { id, userId, title, detail, targetDate, status /* 'open'|'done' */, createdAt, completedAt })
journalFeedback = pgTable("journal_feedback", { id, entryId (ref), mentorId (ref), comment, createdAt })
```

**Files:**
- `lib/prompts.ts` — rotating reflection/gratitude prompts.
- Extend `journal/page.tsx` + client: entry-type tabs, prompt of the day, gratitude flow.
- Create goal tracking UI (in journal or `journey`): add/complete goals → `recordStep`.
- Mentor feedback: in `mentor-portal/[menteeId]`, allow leaving feedback on `mentor_only`/shared entries (respect journal visibility); show feedback to the mentee.

**Tasks:**
- [ ] Schema deltas; `db:push`.
- [ ] Entry types + prompts in journal.
- [ ] Goals CRUD + roadmap credit.
- [ ] Mentor feedback respecting visibility rules.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** Mentee writes typed entries against prompts, tracks a goal to completion (advances progress), and sees mentor feedback on shared entries.

---

## Phase 8 — Parent Portal (§19)

**Goal:** Give parents oversight: progress reports, attendance records, session summaries, and monthly updates — only for children with accepted guardian links (consent-gated, per `lib/guardian.ts`).

**Schema:** reuse `guardianLinks`, `roadmapProgress`, `eventAttendance`, `meetingVerifications`. Optional:
```ts
sessionSummaries = pgTable("session_summaries", { id, mentorshipId (ref), mentorId, summary, createdAt })
```
(Mentor-authored summaries; otherwise derive activity from messages/verifications.)

**Files:**
- Build out `parent-portal/page.tsx`: per linked child — completion %, current phase/stage, attendance, recent session summaries; consent-gated.
- Extend `parent-portal/mentors/page.tsx`: approve/select mentor for the child (§6.3) — approval gates the mentorship becoming `active`.
- Mentor session summary action in `mentor-portal/[menteeId]`.
- Monthly update: a `pushNotifications` row per parent summarizing the month (cron or on-login compute).

**Tasks:**
- [ ] (Optional) `session_summaries` schema; `db:push`.
- [ ] Parent dashboard per child (consent-gated reads only).
- [ ] Mentor selection/approval gating mentorship activation.
- [ ] Mentor session summaries; monthly update notification.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** A parent with an accepted link sees the child's progress/attendance/summaries and nothing for non-consented children; approving a mentor activates the mentorship.

---

## Phase 9 — Payments scaffold (§20, Monime stubbed)

**Goal:** Model and surface payments — mentor subscriptions, one-time packages, scholarship sponsorships — with invoices and history, behind a stubbed gateway. No real charges until Monime credentials are wired.

**Schema:**
```ts
paymentPlans = pgTable("payment_plans", { id, name, kind /* 'subscription'|'package'|'scholarship' */, amount, interval, active })
payments = pgTable("payments", {
  id, payerId (ref), planId (ref), menteeId (ref), amount,
  status /* 'pending'|'paid'|'failed'|'refunded' */,
  provider: text() /* 'monime'|'stub' */, providerRef: text(),
  createdAt, paidAt,
})
invoices = pgTable("invoices", { id, paymentId (ref), number, issuedAt, pdfUrl })
```

**Files:**
- `lib/payments/gateway.ts` — `PaymentGateway` interface; `StubGateway` (marks paid immediately, no network); `MonimeGateway` placeholder throwing "not configured".
- `lib/payments/index.ts` — `createPayment`, `markPaid`, `generateInvoice` (number + record; PDF optional/deferred).
- Build out `parent-portal/payments/page.tsx`: plans, pay (stub), history, invoices, reminders.
- Mentor subscription surface in mentor settings.
- **Gate:** payment unlocks mentorship access (§20) — enforce in `mentorship`/marketplace request flow when a plan requires payment.
- Admin: payments/financial reporting view (extend analytics or new `/admin/payments`).

**Tasks:**
- [ ] Schema (`payment_plans`, `payments`, `invoices`); `db:push`; seed a couple of plans.
- [ ] `PaymentGateway` interface + `StubGateway` + Monime placeholder.
- [ ] Payment actions (create/markPaid/invoice), all validated + role-gated.
- [ ] Parent payments UI + mentor subscription UI + access gating.
- [ ] Admin financial reporting view.
- [ ] `tsc` + `lint` + `build` green.

**Verification:** A parent "pays" via the stub → payment `paid`, invoice generated, mentorship access unlocked; switching `provider` to Monime later requires only implementing `MonimeGateway`.

---

## Success metrics to instrument (§23, §25)

The admin analytics already report active users, retention, completion, attendance, session frequency, satisfaction. As phases land, ensure these feed real data: completion % (Phase 2), attendance (Phase 4), session frequency (Phases 5/6), satisfaction (mentor reviews Phase 3 + surveys), match acceptance rate (Phase 3 — add to analytics).

## Risks & sequencing notes

- **Phase 1 → 2 are foundational**: roadmap and matching both consume the Purpose Profile. Do them first and in order.
- **Storage provider** is a shared prerequisite for Phases 5 and 6 — decide it once (recommend resolving at the start of Phase 5).
- **Growth-tree remap (Phase 2)** changes `lib/growth.ts` semantics; audit all callers (`mentor-portal/actions.ts`, `journey`, `dashboard`, growth-tree component) when it lands.
- **Payments access-gating (Phase 9)** must not break free/scholarship users — gate only when a plan requires payment.
- Each phase ships working software on its own and should be executed via **subagent-driven-development**, expanding that phase's task list into bite-sized TDD steps.
