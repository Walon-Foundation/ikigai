# 🌱 Ikigai Digital — The Purpose Platform
### Build Plan & Design System · Global Standard V2.1
> *Empowering youth to discover purpose, build confidence, and prioritize mental wellness.*
> **Target:** Freetown & Western Rural Area, Sierra Leone

---

## 🌐 Deployment Architecture

Two separate Next.js apps, one shared Neon database.

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│   apps/app/  (User PWA)     │     │  apps/admin/  (Admin Panel)  │
│   url.com                   │     │  admin.url.com               │
│                             │     │                              │
│  - Mentee dashboard         │     │  - Mentor verification       │
│  - Mentor dashboard         │     │  - School vetting            │
│  - Club Lead portal         │     │  - Safety reports queue      │
│  - Growth Tree / Journey    │     │  - KPI analytics             │
│  - Mentorship + Chat        │     │  - Push notification sender  │
│  - Journal (offline-first)  │     │  - User management           │
│  - Pad Her Power            │     │  - Club management           │
│  - Safety resources         │     │                              │
└────────────┬────────────────┘     └───────────────┬──────────────┘
             │                                      │
             └──────────────┬───────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Neon Postgres  │
                   │  (shared DB)    │
                   └─────────────────┘
```

**Both apps share:**
- Same Neon DB
- Same Drizzle schema (`packages/db` in monorepo)
- Same design tokens (`packages/ui`)

**Repo structure — Turborepo monorepo:**

```
ikigai/
├── apps/
│   ├── app/          # url.com — user-facing PWA
│   └── admin/        # admin.url.com — admin dashboard (dark theme default)
├── packages/
│   ├── db/           # Drizzle schema + Neon client (shared)
│   ├── ui/           # Shared shadcn components + design tokens
│   └── config/       # Shared Tailwind + TS config
├── turbo.json
└── package.json
```

---

## 📐 App Structure

### `apps/app/` — User PWA (url.com)

```
app/
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
├── onboarding/               # Interest tagging + purpose quiz
├── dashboard/                # Role-aware home (mentee / mentor / club-lead)
├── journey/                  # Inner Compass / Growth Tree
├── mentorship/               # Vibe-Match + chat
├── pad-her-power/            # Reproductive health module + resource map
├── safety/                   # Consent awareness + static helplines
├── school/                   # Campus portal + clubhouse
├── journal/                  # Private journaling (offline-first)
├── settings/                 # Lite mode, push prefs, privacy controls
└── api/
    ├── match/                # Vibe-Match algorithm
    ├── notifications/        # Push subscription + nudge triggers
    └── sync/                 # IndexedDB → Neon background sync
```

### `apps/admin/` — Admin Dashboard (admin.url.com)

```
admin/
├── (auth)/                   # Clerk sign-in (admin role only)
├── dashboard/                # KPIs, activity feed, pending counts
├── users/                    # All users — filter by role / region
├── mentors/                  # Pending mentor verification queue
│   └── [id]/verify/          # Review ID + CV → approve / reject
├── schools/                  # Pending school registrations
│   └── [id]/vet/             # Approve / reject club leads
├── reports/                  # Safety reports from mentees
│   └── [id]/                 # View, take action, mark resolved
├── notifications/            # Compose + send push notifications
├── analytics/                # KPI charts (clubs, retention, growth levels)
└── api/
    ├── verify-mentor/
    ├── verify-school/
    ├── resolve-report/
    └── send-push/
```

---

## 🛠️ Tech Stack & Tools

| Layer | Tool | Purpose |
|---|---|---|
| **Monorepo** | Turborepo | Manage both apps + shared packages |
| **Framework** | Next.js 16 (App Router) | SSR, API routes, PWA config |
| **Auth** | Clerk | Role-based auth — separate Clerk instances per app |
| **Styling** | Tailwind CSS v4 | Utility-first styling |
| **UI Components** | shadcn/ui | Accessible base components (shared package) |
| **Animation** | Framer Motion | Page transitions, Growth Tree, micro-interactions |
| **Database** | Neon (PostgreSQL) | Serverless Postgres — shared across both apps |
| **ORM** | Drizzle ORM | Type-safe schema + migrations (shared package) |
| **Push Notifications** | Web Push API + `web-push` | Nudges: match, inactivity, milestones, broadcasts |
| **PWA / Offline** | next-pwa + Workbox | Service workers, IndexedDB, background sync |
| **Forms** | React Hook Form + Zod | Onboarding, reporting, verification forms |
| **Maps** | Leaflet.js | Pad Her Power resource mapping |
| **Icons** | Lucide React | Consistent iconography |

**Removed from v1 (deferred to Phase 5):**
- ~~Zustand~~ → `useContext` only if needed
- ~~Resend~~ → email alerts later
- ~~Anthropic Claude API~~ → AI crisis detection later
- ~~Cloudinary~~ → Next.js `<Image quality={60}>` for now

---

## 🗄️ Database Schema (Neon + Drizzle)

```ts
// packages/db/schema.ts

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  role: roleEnum("role").notNull(),        // 'mentee' | 'mentor' | 'club_lead' | 'admin'
  displayName: text("display_name"),
  interestTags: text("interest_tags").array(),
  schoolId: uuid("school_id").references(() => schools.id),
  growthLevel: integer("growth_level").default(1), // 1=Explorer, 2=Advocate, 3=Mentor
  verifiedAt: timestamp("verified_at"),
  pushSubscription: jsonb("push_subscription"),    // Web Push subscription object
  createdAt: timestamp("created_at").defaultNow(),
});

export const mentorships = pgTable("mentorships", {
  id: uuid("id").primaryKey().defaultRandom(),
  menteeId: uuid("mentee_id").references(() => users.id),
  mentorId: uuid("mentor_id").references(() => users.id),
  status: text("status").default("icebreaker"), // 'icebreaker' | 'active' | 'flagged' | 'closed'
  matchScore: integer("match_score"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  visibility: text("visibility").default("private"), // 'private' | 'mentor_only' | 'community'
  keywordFlag: boolean("keyword_flag").default(false), // v1: client-side keyword match only
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  region: text("region"),                  // 'freetown' | 'western_rural'
  clubLeadId: uuid("club_lead_id"),
  verifiedAt: timestamp("verified_at"),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type"),                      // 'purpose_quiz' | 'pad_her_power' | 'safety_module'
  completedAt: timestamp("completed_at").defaultNow(),
});

export const safetyReports = pgTable("safety_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id),
  reportedId: uuid("reported_id").references(() => users.id),
  type: text("type"),                      // 'inappropriate' | 'concern'
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushNotifications = pgTable("push_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type"),                      // 'nudge' | 'match' | 'milestone' | 'broadcast'
  sentAt: timestamp("sent_at").defaultNow(),
});
```

---

## 🎨 Design System

### Color Palette

Drawn from **Sierra Leone's landscape** — lush forest greens, warm golden sunsets, terracotta earth — filtered through a modern, youth-forward lens.

```css
:root {
  /* ── Primary: Deep Forest Green */
  --color-primary:         #1A5C3A;
  --color-primary-light:   #2E8B57;
  --color-primary-muted:   #A8D5B5;

  /* ── Accent: Golden Sunrise */
  --color-accent:          #F5A623;
  --color-accent-warm:     #E8854A;
  --color-accent-pale:     #FDE8C8;

  /* ── Earth: Terracotta Grounding */
  --color-earth:           #C05C3A;
  --color-earth-light:     #E8A07A;

  /* ── Sky: Clean Clarity */
  --color-sky:             #4A90D9;
  --color-sky-pale:        #D6EAF8;

  /* ── Neutrals */
  --color-bg:              #FAFAF7;
  --color-surface:         #FFFFFF;
  --color-surface-2:       #F0EDE8;
  --color-text-primary:    #1C1C1A;
  --color-text-secondary:  #5C5A55;
  --color-text-muted:      #9C9A95;
  --color-border:          #E5E2DC;

  /* ── Status */
  --color-danger:          #D62B2B;
  --color-success:         #2E8B57;
  --color-warning:         #F5A623;
}
```

**Admin dark theme** (default for admin.url.com):
```css
[data-theme="dark"] {
  --color-bg:              #0F1A14;
  --color-surface:         #162010;
  --color-surface-2:       #1E2D1A;
  --color-text-primary:    #F0EDE8;
  --color-text-secondary:  #A8A59F;
  --color-border:          #2A3D25;
}
```

---

### Typography

```css
/* Display / Headings — Editorial warmth, evokes storytelling */
--font-display: 'Fraunces', serif;      /* Variable weight 100–900 */

/* Body — Clean humanist, legible on low-res mobile screens */
--font-body: 'DM Sans', sans-serif;

/* Mono — Admin data tables, stats */
--font-mono: 'JetBrains Mono', monospace;
```

```ts
// layout.tsx
import { Fraunces, DM_Sans, JetBrains_Mono } from 'next/font/google'
```

**Type Scale:**
```
Display:  3.5rem  / 900  — Hero sections, milestone unlock moments
H1:       2.25rem / 700  — Page titles
H2:       1.5rem  / 600  — Section headers
H3:       1.125rem/ 600  — Card titles
Body:     1rem    / 400  — General text
Small:    0.875rem/ 400  — Captions, labels
Tiny:     0.75rem / 500  — Tags, badges
```

---

### Spacing & Radius

```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-6: 24px;  --space-8: 32px;  --space-12: 48px; --space-16: 64px;

--radius-sm:   6px;
--radius-md:   12px;
--radius-lg:   20px;
--radius-xl:   32px;
--radius-pill: 9999px;
```

---

## ✨ Animation Plan (Framer Motion)

### Page Transitions
```ts
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25 } }
}
```

### Growth Tree (Centerpiece)
- Organic SVG tree — branches grow via `pathLength: 0 → 1` on milestone unlock
- Leaves spawn with `scale: 0 → 1` + `rotate: -15 → 0` spring physics
- Particle burst (`AnimatePresence`) on level-up
- Idle: gentle trunk sway via `keyframes`

### Vibe-Match Flow
- Interest tags: staggered `scale` + `opacity` entrance (0.05s delay each)
- Match reveal: card flip `rotateY: 0° → 180°`
- Connection line: SVG `pathLength` draw animation

### Onboarding Wizard
- Steps: `x: 100% → 0%` enter, `x: 0 → -100%` exit
- Progress bar: `scaleX` spring

### Push Notification Toast
- Slide in from top-right: `x: 100% → 0`, auto-dismiss after 4s
- Milestone unlock: `rotate: [0, -10, 10, -5, 0]` spring celebration

### Dashboard Cards
- Stagger: `delayChildren: 0.1`, `staggerChildren: 0.08`
- Hover: `y: -4` + deeper shadow

### Micro-interactions
- Button press: `scale: 0.96`
- Offline banner: `y: -100% → 0` slide down
- Admin table rows: fade-in stagger on load

---

## 🔔 Push Notification System

```ts
// apps/app/api/notifications/subscribe/route.ts
// Saves browser push subscription → users.pushSubscription in Neon

// apps/admin/api/send-push/route.ts
// Admin composes + sends to all / by role / by school

// Automated nudges via Vercel Cron:
// - Mentor inactive 4 days  → nudge mentor
// - New Vibe-Match found     → notify mentee
// - Milestone unlocked       → celebrate with mentee
```

Notification payloads:
```json
{ "nudge":     { "title": "Check in with your mentee 👋" } }
{ "match":     { "title": "You've been matched! 🌱"      } }
{ "milestone": { "title": "New milestone unlocked! 🏆"   } }
{ "broadcast": { "title": "Ikigai Update 📢"             } }
```

**Package:** `web-push` — no third-party service needed.

---

## 🛡️ Safety Architecture (v1 — Lightweight)

### Client-side Keyword Filter
```ts
const CONCERN_KEYWORDS = ['hurt myself', 'end it', 'give up', 'no reason to']

export function checkKeywords(text: string): boolean {
  return CONCERN_KEYWORDS.some(kw => text.toLowerCase().includes(kw))
}
// If matched → show static "Are you okay?" banner inline
// + store keywordFlag: true in journal entry (visible to admin)
```

### Static Crisis Resources Page (`/safety/help`)
- Hardcoded Freetown helpline numbers
- "Talk to Someone" → opens WhatsApp to Ikigai admin number
- Cached offline by service worker — always available

### Anonymous Reporting
- One-tap report on mentor profiles + chat
- Stored in `safety_reports` table
- Admin sees + resolves queue at `admin.url.com/reports`

> 🔜 **Phase 5:** Anthropic Claude API for severity classification + push/email alerts

---

## 🧭 User Role Flows

### Mentee Onboarding
1. Sign up via Clerk Google SSO
2. Interest Tag Selection (min 3 tags)
3. Purpose Discovery Quiz → Explorer badge (Level 1)
4. Vibe-Match → 3-day Icebreaker Phase
5. Dashboard: Growth Tree + Journal + Module feed

### Mentor Verification *(Admin reviews at admin.url.com/mentors)*
1. Sign up → select "I'm a Mentor"
2. Upload Gov ID + CV
3. Admin approves → enters matching pool

### Club Lead Registration *(Admin reviews at admin.url.com/schools)*
1. "Register Your School" form
2. Admin vets → School Clubhouse unlocked

---

## 📊 KPI Instrumentation

| KPI | Query |
|---|---|
| School clubs established | `schools WHERE verified_at IS NOT NULL` |
| Safety report resolution time | `resolved_at - created_at` avg |
| Mentees reaching Advocate in 3 months | `milestones` cohort + `growthLevel >= 2` within 90 days |
| Mentor inactivity | Cron: `last_activity_at < NOW() - INTERVAL '4 days'` |

---

## 🚀 Phased Build Roadmap

### Phase 1 — Foundation (Weeks 1–3)
- [ ] Turborepo monorepo setup
- [ ] `packages/db` — Drizzle schema + Neon connection
- [ ] `apps/app` — Next.js 16 + Clerk + Tailwind + shadcn
- [ ] `apps/admin` — Next.js 16 + Clerk (admin role guard) + dark theme
- [ ] Shared design tokens + fonts in `packages/ui`

### Phase 2 — User App Core (Weeks 4–7)
- [ ] Onboarding flow + interest tagging
- [ ] Vibe-Match algorithm (API route)
- [ ] Growth Tree SVG + Framer Motion animations
- [ ] Journal — offline-first with IndexedDB + background sync
- [ ] Pad Her Power module + Leaflet resource map
- [ ] Push notification subscribe + nudge triggers

### Phase 3 — Admin App + Safety (Weeks 8–10)
- [ ] Admin dashboard with KPI overview
- [ ] Mentor verification queue
- [ ] School vetting flow
- [ ] Safety reports queue
- [ ] Push notification composer (broadcasts)
- [ ] Anonymous reporting on user app

### Phase 4 — Polish & PWA (Weeks 11–12)
- [ ] PWA config + service worker (next-pwa)
- [ ] Lite Mode (text-only, no images)
- [ ] Performance audit (Lighthouse >90 on 3G simulation)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Static crisis resources page (cached offline)

### Phase 5 — AI & Alerts (Future)
- [ ] Anthropic Claude API — crisis severity classification
- [ ] Push + Resend email alerts to admin
- [ ] Africa's Talking SMS as regional fallback

---

## 📦 Key Package List

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "@clerk/nextjs": "latest",
    "tailwindcss": "^4.0.0",
    "framer-motion": "^11.0.0",
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest",
    "react-hook-form": "^7.0.0",
    "zod": "^3.22.0",
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.0.0",
    "lucide-react": "latest",
    "web-push": "latest",
    "idb": "^8.0.0",
    "next-pwa": "^5.6.0"
  },
  "devDependencies": {
    "turbo": "latest",
    "drizzle-kit": "latest",
    "@types/web-push": "latest",
    "@types/leaflet": "latest"
  }
}
```

---

## 🌍 Localization Notes

- Default: **English (Sierra Leone)**
- All UI strings in `/locales/en.json` from Day 1
- Timezone: `Africa/Freetown` via `Intl.DateTimeFormat`
- Future: Krio language support (`/locales/kri.json`)

---

*Built with love for the youth of Sierra Leone. 🌱*
*"Ikigai" — finding the reason you wake up every morning.*