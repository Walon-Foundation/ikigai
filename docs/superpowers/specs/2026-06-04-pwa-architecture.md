# PWA Architecture — Role-Based Restructure
# Design Spec

**Date:** 2026-06-04
**Status:** Approved
**Surface:** `app.ikigai.app` — `app/(pwa)/`

---

## Goal

Restructure the PWA around three distinct user roles — mentee, mentor, and parent/guardian — each with their own onboarding flow, navigation, dashboard, and accessible routes. Remove the `club_lead` role from the UI (schema migration is out of scope for this spec).

---

## Architecture Overview

Single Next.js app, subdomain-routed. `proxy.ts` middleware gates all PWA paths to `app.ikigai.app`. The `(pwa)` route group is organisational only — it does not appear in URLs.

```
app/(pwa)/
├── layout.tsx                          # ClerkProvider + SW registration
├── install/page.tsx
│
├── (auth)/                             # Unauthenticated shell
│   ├── layout.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
├── onboarding/                         # Step 0: role picker (all roles)
│   ├── page.tsx                        # Role selector → redirect to sub-route
│   ├── layout.tsx                      # Shared shell: progress bar + brand header
│   ├── mentee/
│   │   ├── assessment/page.tsx         # Ikigai 4-pillar assessment
│   │   ├── values/page.tsx             # Values ranking
│   │   ├── personality/page.tsx        # Personality dimensions
│   │   └── profile/page.tsx            # Purpose Profile reveal + statement
│   ├── mentor/
│   │   ├── profile/page.tsx            # Bio, expertise, experience
│   │   ├── pricing/page.tsx            # Session rates + availability
│   │   └── verification/page.tsx       # ID + CV upload → pending review
│   └── parent/
│       ├── profile/page.tsx            # Guardian details
│       └── link/page.tsx               # Link to child's account
│
└── (app)/
    ├── layout.tsx                      # Auth guard + role-aware nav shell
    ├── dashboard/
    │   ├── page.tsx
    │   └── dashboard-client.tsx        # Separate MenteeView / MentorView / ParentView
    ├── journey/page.tsx                # Mentee only
    ├── mentorship/
    │   ├── page.tsx                    # Mentee: browse/match · Mentor: session list
    │   ├── [id]/page.tsx               # Mentorship room: messages + notes
    │   └── actions.ts
    ├── journal/
    │   ├── page.tsx
    │   ├── journal-client.tsx
    │   └── actions.ts
    ├── activities/
    │   ├── page.tsx                    # Activity Hub (all roles)
    │   └── [id]/page.tsx               # Event detail + RSVP
    ├── mentor-portal/
    │   ├── page.tsx                    # Mentor's mentees list + stats
    │   └── [menteeId]/page.tsx         # Individual mentee progress view
    ├── parent-portal/
    │   ├── page.tsx                    # Child overview + mentor approval
    │   ├── mentors/page.tsx            # Browse/approve mentors
    │   └── payments/page.tsx           # Subscriptions + payment history
    ├── pad-her-power/
    │   ├── page.tsx
    │   └── resource-map-client.tsx
    ├── safety/
    │   ├── page.tsx
    │   └── help/page.tsx
    └── settings/
        ├── page.tsx
        └── settings-client.tsx
```

---

## Onboarding Flows

### Shared Shell (`onboarding/layout.tsx`)

- Progress bar (step X of N, role-specific total)
- Back button (navigates to previous step)
- Ikigai wordmark header
- No sidebar or bottom nav

### Resume Logic

On every visit to any `/(app)` route, `(app)/layout.tsx` checks:

```
no role set          → /onboarding
mentee, no profile   → /onboarding/mentee/assessment  (or next incomplete step)
mentor, no ID upload → /onboarding/mentor/profile      (or next incomplete step)
parent, no child link→ /onboarding/parent/profile      (or next incomplete step)
otherwise            → continue to requested route
```

Each step writes to the DB on submit. "Next incomplete step" is determined by which DB fields are null.

---

### Mentee — 4 Steps

```
/onboarding → /onboarding/mentee/assessment → /onboarding/mentee/values
           → /onboarding/mentee/personality → /onboarding/mentee/profile
           → /dashboard
```

**Step 1 — Ikigai Assessment** (`/onboarding/mentee/assessment`)

Four sub-sections, paged internally (one at a time, not separate routes):

| Sub-section | Question examples |
|---|---|
| What Do You Love? | Activities that make you lose track of time, hobbies, what you'd do if money didn't matter |
| What Are You Good At? | Skills you're proud of, what people ask your help with |
| What Does Your Community Need? | Problems that concern you, change you want to create |
| What Can Create Opportunities? | Career interests, skills you'd earn from |

Each sub-section: multi-select tags + one open text field. Saved as `assessmentData` JSON on the user record.

**Step 2 — Values Ranking** (`/onboarding/mentee/values`)

User ranks 6 values by tap ordering: Integrity · Service · Creativity · Leadership · Family · Innovation. Saved as ordered array.

**Step 3 — Personality** (`/onboarding/mentee/personality`)

Four sliding scales (1–5):
- Introvert ←→ Extrovert
- Structured ←→ Flexible
- Creative ←→ Analytical
- Independent ←→ Collaborative

**Step 4 — Purpose Profile Reveal** (`/onboarding/mentee/profile`)

Generated from steps 1–3:
- Purpose Statement (e.g. *"You are a creative communicator passionate about storytelling and community impact. You thrive in collaborative environments and enjoy helping others grow."*)
- Summary cards: Interests · Skills · Values · Personality
- Unlock: Explorer badge, Level 1 Growth Tree, `purpose_quiz` milestone
- CTA: "Go to My Dashboard" → writes `purposeProfile` to DB, redirects to `/dashboard`

---

### Mentor — 3 Steps

```
/onboarding → /onboarding/mentor/profile → /onboarding/mentor/pricing
           → /onboarding/mentor/verification → /dashboard (pending banner)
```

**Step 1 — Profile** (`/onboarding/mentor/profile`)

Fields: display name, bio (textarea), areas of expertise (multi-select), industry/sector, years of experience, languages spoken, location (city).

**Step 2 — Pricing & Availability** (`/onboarding/mentor/pricing`)

Fields: session rate (number + currency), package types (1-on-1 / group / both), weekly availability (day + time slot multi-select).

**Step 3 — Verification** (`/onboarding/mentor/verification`)

Fields: government ID upload, CV/resume upload, brief personal statement (textarea).

On submit: sets `verifiedAt = null` (pending). Mentor lands on `/dashboard` with a full-width **"Your application is under review"** banner. They can browse but cannot be matched or accept mentees until `verifiedAt` is set by admin.

---

### Parent/Guardian — 2 Steps

```
/onboarding → /onboarding/parent/profile → /onboarding/parent/link
           → /parent-portal
```

**Step 1 — Profile** (`/onboarding/parent/profile`)

Fields: full name, relationship to child (parent / guardian / other), contact phone number.

**Step 2 — Link Child** (`/onboarding/parent/link`)

Two paths:
- **Child has account**: enter child's email or unique invite code → sends link request → child confirms in their settings → parent redirected to `/parent-portal`
- **Child has no account**: enter child's email → system generates a unique invite link (stored in DB, no email needed yet — parent copies and shares it manually) → parent redirected to `/parent-portal` with "Invite link ready" state showing the copyable link

---

## Navigation

`AppNav` (mobile bottom bar) and `AppSidebar` (desktop) render based on authenticated user role. No role-switcher tabs anywhere.

### Mentee

| Label | Route | Icon |
|-------|-------|------|
| Home | `/dashboard` | LayoutDashboard |
| Journey | `/journey` | TreePine |
| Match | `/mentorship` | Users |
| Journal | `/journal` | BookOpen |
| Profile | `/settings` | Avatar initials |

Sidebar also shows: **Modules** section → Pad Her Power · Safety

### Mentor

| Label | Route | Icon |
|-------|-------|------|
| Home | `/dashboard` | LayoutDashboard |
| My Mentees | `/mentor-portal` | Users |
| Messages | `/mentorship` | MessageCircle |
| Activities | `/activities` | Calendar |
| Profile | `/settings` | Avatar initials |

### Parent/Guardian

| Label | Route | Icon |
|-------|-------|------|
| Home | `/dashboard` | LayoutDashboard |
| My Child | `/parent-portal` | Heart |
| Mentors | `/parent-portal/mentors` | Star |
| Payments | `/parent-portal/payments` | CreditCard |
| Profile | `/settings` | Avatar initials |

---

## Route Guards

Enforced in `(app)/layout.tsx`. Unauthorized access redirects to `/dashboard`.

| Route | Allowed roles |
|-------|--------------|
| `/journey` | mentee |
| `/journal` | mentee |
| `/pad-her-power` | mentee |
| `/mentor-portal/*` | mentor |
| `/parent-portal/*` | parent |
| `/mentorship/*` | mentee, mentor |
| `/activities/*` | mentee, mentor, parent |
| `/safety/*` | mentee, mentor, parent |
| `/settings` | mentee, mentor, parent |

---

## Dashboards

No role-switcher. Each role renders its own view component directly.

### Mentee Dashboard

- Greeting + role badge (Explorer · Level 1)
- Growth Tree mini card (milestone count, current phase, progress bar to next level)
- Active Mentor card (avatar, name, status → "Send a message")
- My Roadmap (current phase name, tasks remaining)
- Recent Journal entry (last entry preview)
- Active Modules (Pad Her Power, Safety)

### Mentor Dashboard

- Greeting + verification status badge (Verified / Pending Review)
- Quick stats row (active mentees · sessions this month · avg rating)
- My Mentees list (avatar, name, current phase, last active date → "View progress")
- Upcoming Sessions (date, mentee name)
- Pending feedback to submit

### Parent Dashboard

- Greeting + "Guardian of [child name]"
- Child's progress card (mini Growth Tree, level, milestone count, current phase)
- Current Mentor card (avatar, name, Approve / Decline if pending · "Approved" if confirmed)
- Recent activity feed (journal entry, session completed, milestone unlocked)
- Payments summary (next invoice date → "Manage payments")

---

## proxy.ts Changes

Add new PWA paths to the `PWA_PATHS` blocklist so they redirect from `ikigai.app` to `app.ikigai.app`:

```ts
"/mentor-portal",
"/parent-portal",
"/activities",
```

---

## Files Changed

| Action | File |
|--------|------|
| Rewrite | `app/(pwa)/onboarding/page.tsx` |
| Create | `app/(pwa)/onboarding/layout.tsx` |
| Create | `app/(pwa)/onboarding/mentee/assessment/page.tsx` |
| Create | `app/(pwa)/onboarding/mentee/values/page.tsx` |
| Create | `app/(pwa)/onboarding/mentee/personality/page.tsx` |
| Create | `app/(pwa)/onboarding/mentee/profile/page.tsx` |
| Create | `app/(pwa)/onboarding/mentor/profile/page.tsx` |
| Create | `app/(pwa)/onboarding/mentor/pricing/page.tsx` |
| Create | `app/(pwa)/onboarding/mentor/verification/page.tsx` |
| Create | `app/(pwa)/onboarding/parent/profile/page.tsx` |
| Create | `app/(pwa)/onboarding/parent/link/page.tsx` |
| Rewrite | `app/(pwa)/(app)/layout.tsx` |
| Rewrite | `app/(pwa)/(app)/dashboard/dashboard-client.tsx` |
| Rewrite | `components/app-nav.tsx` |
| Rewrite | `components/app-sidebar.tsx` |
| Create | `app/(pwa)/(app)/activities/page.tsx` |
| Create | `app/(pwa)/(app)/activities/[id]/page.tsx` |
| Create | `app/(pwa)/(app)/mentor-portal/page.tsx` |
| Create | `app/(pwa)/(app)/mentor-portal/[menteeId]/page.tsx` |
| Create | `app/(pwa)/(app)/parent-portal/page.tsx` |
| Create | `app/(pwa)/(app)/parent-portal/mentors/page.tsx` |
| Create | `app/(pwa)/(app)/parent-portal/payments/page.tsx` |
| Rewrite | `app/(pwa)/onboarding/actions.ts` |
| Modify | `app/(pwa)/(app)/dashboard/page.tsx` |
| Delete | `app/(pwa)/(app)/school/page.tsx` |
| Delete | `app/(pwa)/(app)/school/register-form.tsx` |
| Delete | `app/(pwa)/(app)/school/actions.ts` |
| Modify | `proxy.ts` |

---

## Out of Scope

- Schema migration (`club_lead` → `parent`, new tables for assessments, payments, activities)
- Full Ikigai assessment data model and AI matching logic
- Payment processing integration
- Activity Hub content and event management
- Mentor marketplace browse/filter UI
- In-person meeting verification (GPS, QR, photo)
- Push notification content per role
