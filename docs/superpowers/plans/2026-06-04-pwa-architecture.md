# PWA Architecture — Role-Based Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the PWA around three distinct roles (mentee, mentor, parent/guardian) with role-specific onboarding sub-routes, navigation, dashboards, and route guards.

**Architecture:** Hybrid onboarding — role picker at `/onboarding`, then branch to `/onboarding/mentee/*`, `/onboarding/mentor/*`, `/onboarding/parent/*`. A shared `onboarding/layout.tsx` provides the progress shell. Post-onboarding, `(app)/layout.tsx` enforces route guards by role. Nav components render different items per role.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Neon, Clerk auth, Tailwind CSS v4, TypeScript, Biome (lint/format), `bun` as command runner.

> **Before writing any code:** Read `node_modules/next/dist/docs/index.md` for Next.js 16 conventions. All server actions use `"use server"`. All interactive components use `"use client"`. Params in dynamic routes are `Promise<{ id: string }>` — unwrap with `use(params)` in client components or `await params` in server components.

---

## File Map

| Action | File |
|--------|------|
| Modify | `db/schema.ts` |
| Modify | `proxy.ts` |
| Create | `app/(pwa)/onboarding/layout.tsx` |
| Rewrite | `app/(pwa)/onboarding/page.tsx` |
| Rewrite | `app/(pwa)/onboarding/actions.ts` |
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
| Modify | `app/(pwa)/(app)/dashboard/page.tsx` |
| Rewrite | `app/(pwa)/(app)/dashboard/dashboard-client.tsx` |
| Rewrite | `components/app-nav.tsx` |
| Rewrite | `components/app-sidebar.tsx` |
| Create | `app/(pwa)/(app)/mentor-portal/page.tsx` |
| Create | `app/(pwa)/(app)/mentor-portal/[menteeId]/page.tsx` |
| Create | `app/(pwa)/(app)/parent-portal/page.tsx` |
| Create | `app/(pwa)/(app)/parent-portal/mentors/page.tsx` |
| Create | `app/(pwa)/(app)/parent-portal/payments/page.tsx` |
| Create | `app/(pwa)/(app)/activities/page.tsx` |
| Create | `app/(pwa)/(app)/activities/[id]/page.tsx` |
| Delete | `app/(pwa)/(app)/school/page.tsx` |
| Delete | `app/(pwa)/(app)/school/register-form.tsx` |
| Delete | `app/(pwa)/(app)/school/actions.ts` |

---

## Task 1: Schema — add `parent` role + `onboardingData` column

**Files:**
- Modify: `db/schema.ts`

These two changes are the minimum needed for the architecture to function. No tables are added — that is a separate schema plan.

- [ ] **Step 1: Add `parent` to roleEnum and `onboardingData` column to users**

Open `db/schema.ts`. Make two changes:

```ts
// Change roleEnum from:
export const roleEnum = pgEnum("role", [
  "mentee",
  "mentor",
  "club_lead",
  "admin",
]);

// To:
export const roleEnum = pgEnum("role", [
  "mentee",
  "mentor",
  "club_lead",
  "parent",
  "admin",
]);
```

Then add `onboardingData` to the `users` table definition (after `pushSubscription`):

```ts
pushSubscription: jsonb("push_subscription"),
onboardingData: jsonb("onboarding_data"),
createdAt: timestamp("created_at").defaultNow(),
```

- [ ] **Step 2: Push the schema change to the database**

```bash
bun drizzle-kit push
```

Expected: prompts about adding enum value and column — confirm both. No data loss.

- [ ] **Step 3: Verify build still compiles**

```bash
bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors about roleEnum or users columns.

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts && git commit -m "feat: add parent role to enum + onboardingData jsonb column"
```

---

## Task 2: proxy.ts — add new PWA paths

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Add new paths to `isProtectedRoute`**

In `proxy.ts`, find the `isProtectedRoute` definition and add three new matchers:

```ts
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/journey(.*)",
  "/mentorship(.*)",
  "/journal(.*)",
  "/settings(.*)",
  "/pad-her-power(.*)",
  "/safety(.*)",
  "/school(.*)",
  "/onboarding(.*)",
  "/mentor-portal(.*)",
  "/parent-portal(.*)",
  "/activities(.*)",
  "/admin((?!/sign-in).*)",
]);
```

- [ ] **Step 2: Add new paths to `PWA_PATHS` blocklist**

Find the `PWA_PATHS` array and add:

```ts
const PWA_PATHS = [
  "/dashboard",
  "/journal",
  "/journey",
  "/mentorship",
  "/pad-her-power",
  "/safety",
  "/school",
  "/settings",
  "/onboarding",
  "/sign-in",
  "/sign-up",
  "/install",
  "/mentor-portal",
  "/parent-portal",
  "/activities",
];
```

- [ ] **Step 3: Verify**

```bash
bun biome check proxy.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts && git commit -m "feat: add mentor-portal, parent-portal, activities to PWA path guards"
```

---

## Task 3: Onboarding shared layout + role selector

**Files:**
- Create: `app/(pwa)/onboarding/layout.tsx`
- Rewrite: `app/(pwa)/onboarding/page.tsx`
- Rewrite: `app/(pwa)/onboarding/actions.ts`

- [ ] **Step 1: Create the shared onboarding layout**

Create `app/(pwa)/onboarding/layout.tsx`:

```tsx
import { OnboardingShell } from "./shell";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
```

Create `app/(pwa)/onboarding/shell.tsx` (client component for path-aware progress):

```tsx
"use client";

import { usePathname } from "next/navigation";

const STEP_MAP: Record<string, { current: number; total: number }> = {
  "/onboarding/mentee/assessment": { current: 1, total: 4 },
  "/onboarding/mentee/values": { current: 2, total: 4 },
  "/onboarding/mentee/personality": { current: 3, total: 4 },
  "/onboarding/mentee/profile": { current: 4, total: 4 },
  "/onboarding/mentor/profile": { current: 1, total: 3 },
  "/onboarding/mentor/pricing": { current: 2, total: 3 },
  "/onboarding/mentor/verification": { current: 3, total: 3 },
  "/onboarding/parent/profile": { current: 1, total: 2 },
  "/onboarding/parent/link": { current: 2, total: 2 },
};

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = STEP_MAP[pathname];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-black text-primary">
              Ikigai
            </span>
            {step && (
              <span className="text-sm text-muted-foreground">
                Step {step.current} of {step.total}
              </span>
            )}
          </div>
          {step && (
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(step.current / step.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-6 py-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the role selector page**

Rewrite `app/(pwa)/onboarding/page.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setRole } from "./actions";

type Role = "mentee" | "mentor" | "parent";

const ROLES = [
  {
    value: "mentee" as Role,
    emoji: "🌱",
    title: "Mentee",
    desc: "I'm a young person looking to discover my purpose and grow with a mentor.",
  },
  {
    value: "mentor" as Role,
    emoji: "🤝",
    title: "Mentor",
    desc: "I'm a professional ready to guide and invest in the next generation.",
  },
  {
    value: "parent" as Role,
    emoji: "👨‍👩‍👧",
    title: "Parent / Guardian",
    desc: "I want to support and oversee my child's mentorship journey.",
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    if (!selected) return;
    startTransition(() => setRole(selected));
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        How will you join?
      </h2>
      <p className="mb-8 text-muted-foreground">
        Choose your role to personalise your experience.
      </p>
      <div className="space-y-4">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setSelected(r.value)}
            className={cn(
              "flex w-full items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all",
              selected === r.value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span className="text-3xl">{r.emoji}</span>
            <div className="flex-1">
              <p className="font-display text-lg font-bold text-foreground">
                {r.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite actions.ts with all onboarding server actions**

Rewrite `app/(pwa)/onboarding/actions.ts`:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { milestones, users } from "@/db/schema";

type OnboardingData = {
  roleSelected?: boolean;
  // mentee
  assessment?: {
    love: string[];
    skills: string[];
    community: string[];
    opportunity: string[];
    loveText?: string;
    skillsText?: string;
    communityText?: string;
    opportunityText?: string;
  };
  valuesRanking?: string[];
  personality?: {
    introvertExtrovert: number;
    structuredFlexible: number;
    creativeAnalytical: number;
    independentCollaborative: number;
  };
  purposeProfile?: {
    statement: string;
    interests: string[];
    values: string[];
    personalityLabel: string;
  };
  // mentor
  mentorProfile?: {
    expertise: string[];
    industry: string;
    yearsExperience: number;
    languages: string[];
    location: string;
  };
  mentorPricing?: {
    hourlyRate: number;
    packageTypes: string[];
    availability: string[];
  };
  verificationSubmitted?: boolean;
  // parent
  parentProfile?: {
    relationship: string;
    phone: string;
  };
  childEmail?: string;
  inviteCode?: string;
  childLinked?: boolean;
};

async function getUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");
  return user;
}

async function patchOnboardingData(
  clerkId: string,
  patch: Partial<OnboardingData>,
) {
  const [user] = await db
    .select({ onboardingData: users.onboardingData })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  const current = (user?.onboardingData as OnboardingData | null) ?? {};
  await db
    .update(users)
    .set({ onboardingData: { ...current, ...patch } })
    .where(eq(users.clerkId, clerkId));
}

export async function setRole(role: "mentee" | "mentor" | "parent") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db
    .update(users)
    .set({ role })
    .where(eq(users.clerkId, userId));
  await patchOnboardingData(userId, { roleSelected: true });
  if (role === "mentee") redirect("/onboarding/mentee/assessment");
  if (role === "mentor") redirect("/onboarding/mentor/profile");
  redirect("/onboarding/parent/profile");
}

export async function saveMenteeAssessment(data: {
  love: string[];
  loveText: string;
  skills: string[];
  skillsText: string;
  community: string[];
  communityText: string;
  opportunity: string[];
  opportunityText: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { assessment: data });
  redirect("/onboarding/mentee/values");
}

export async function saveMenteeValues(valuesRanking: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { valuesRanking });
  redirect("/onboarding/mentee/personality");
}

export async function saveMenteePersonality(personality: {
  introvertExtrovert: number;
  structuredFlexible: number;
  creativeAnalytical: number;
  independentCollaborative: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { personality });
  redirect("/onboarding/mentee/profile");
}

export async function completeMenteeOnboarding() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const user = await getUser();
  const data = (user.onboardingData as OnboardingData | null) ?? {};

  const interests = [
    ...(data.assessment?.love ?? []),
    ...(data.assessment?.opportunity ?? []),
  ].slice(0, 4);

  const values = data.valuesRanking?.slice(0, 3) ?? [];

  const pe = data.personality;
  const personalityLabel =
    pe
      ? [
          pe.introvertExtrovert <= 2 ? "Introverted" : pe.introvertExtrovert >= 4 ? "Extroverted" : "Balanced",
          pe.creativeAnalytical <= 2 ? "Creative" : pe.creativeAnalytical >= 4 ? "Analytical" : "Versatile",
        ].join(", ")
      : "Growth-oriented";

  const community = data.assessment?.community?.[0] ?? "community development";
  const topInterest = interests[0] ?? "personal growth";

  const statement = `You are a ${personalityLabel.toLowerCase()} individual passionate about ${topInterest.toLowerCase()} and ${community.toLowerCase()}. You are driven by ${values[0]?.toLowerCase() ?? "integrity"} and committed to making a meaningful impact.`;

  const purposeProfile = { statement, interests, values, personalityLabel };

  await patchOnboardingData(userId, { purposeProfile });

  await db
    .insert(milestones)
    .values({ userId: user.id, type: "purpose_quiz" })
    .onConflictDoNothing();

  redirect("/dashboard");
}

export async function saveMentorProfile(data: {
  bio: string;
  expertise: string[];
  industry: string;
  yearsExperience: number;
  languages: string[];
  location: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db
    .update(users)
    .set({ bio: data.bio })
    .where(eq(users.clerkId, userId));
  await patchOnboardingData(userId, {
    mentorProfile: {
      expertise: data.expertise,
      industry: data.industry,
      yearsExperience: data.yearsExperience,
      languages: data.languages,
      location: data.location,
    },
  });
  redirect("/onboarding/mentor/pricing");
}

export async function saveMentorPricing(data: {
  hourlyRate: number;
  packageTypes: string[];
  availability: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { mentorPricing: data });
  redirect("/onboarding/mentor/verification");
}

export async function submitMentorVerification() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { verificationSubmitted: true });
  redirect("/dashboard");
}

export async function saveParentProfile(data: {
  displayName: string;
  relationship: string;
  phone: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db
    .update(users)
    .set({ displayName: data.displayName })
    .where(eq(users.clerkId, userId));
  await patchOnboardingData(userId, {
    parentProfile: { relationship: data.relationship, phone: data.phone },
  });
  redirect("/onboarding/parent/link");
}

export async function saveParentLink(childEmail: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Check if child account exists
  const [child] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, childEmail))
    .limit(1);

  if (child) {
    await patchOnboardingData(userId, {
      childEmail,
      childLinked: true,
    });
  } else {
    // Generate copyable invite code (child signs up and links via this code)
    const inviteCode = `IK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await patchOnboardingData(userId, {
      childEmail,
      inviteCode,
    });
  }

  redirect("/parent-portal");
}
```

- [ ] **Step 4: Check for type errors**

```bash
bun run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors in onboarding files.

- [ ] **Step 5: Commit**

```bash
git add app/\(pwa\)/onboarding/ && git commit -m "feat: add onboarding layout shell, role selector, and all server actions"
```

---

## Task 4: Mentee onboarding — assessment page

**Files:**
- Create: `app/(pwa)/onboarding/mentee/assessment/page.tsx`

- [ ] **Step 1: Create the assessment page**

```tsx
"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveMenteeAssessment } from "../../actions";

const LOVE_TAGS = ["Writing", "Art", "Technology", "Public Speaking", "Music", "Entrepreneurship", "Sports", "Teaching", "Design", "Research"];
const SKILLS_TAGS = ["Leadership", "Communication", "Design", "Problem Solving", "Organisation", "Empathy", "Analysis", "Creativity", "Technology", "Writing"];
const COMMUNITY_TAGS = ["Education", "Mental Health", "Gender Equality", "Youth Employment", "Climate Action", "Healthcare", "Safety", "Economic Growth"];
const OPPORTUNITY_TAGS = ["Journalism", "Business", "Technology", "Healthcare", "Law", "Engineering", "Education", "Arts", "Finance", "Science"];

type Section = "love" | "skills" | "community" | "opportunity";

const SECTIONS: { key: Section; title: string; question: string; tags: string[] }[] = [
  { key: "love", title: "What Do You Love?", question: "What activities make you lose track of time?", tags: LOVE_TAGS },
  { key: "skills", title: "What Are You Good At?", question: "What skills are you most proud of?", tags: SKILLS_TAGS },
  { key: "community", title: "What Does Your Community Need?", question: "What problems concern you most?", tags: COMMUNITY_TAGS },
  { key: "opportunity", title: "What Can Create Opportunities?", question: "What career or skill interests you most?", tags: OPPORTUNITY_TAGS },
];

export default function AssessmentPage() {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [selected, setSelected] = useState<Record<Section, string[]>>({ love: [], skills: [], community: [], opportunity: [] });
  const [texts, setTexts] = useState<Record<Section, string>>({ love: "", skills: "", community: "", opportunity: "" });
  const [isPending, startTransition] = useTransition();

  const section = SECTIONS[sectionIdx];
  const isLast = sectionIdx === SECTIONS.length - 1;

  function toggleTag(tag: string) {
    setSelected((prev) => {
      const current = prev[section.key];
      return {
        ...prev,
        [section.key]: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
      };
    });
  }

  function handleNext() {
    if (isLast) {
      startTransition(() =>
        saveMenteeAssessment({
          love: selected.love,
          loveText: texts.love,
          skills: selected.skills,
          skillsText: texts.skills,
          community: selected.community,
          communityText: texts.community,
          opportunity: selected.opportunity,
          opportunityText: texts.opportunity,
        }),
      );
    } else {
      setSectionIdx((i) => i + 1);
    }
  }

  return (
    <div>
      {/* Sub-progress dots */}
      <div className="mb-6 flex gap-2">
        {SECTIONS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              i <= sectionIdx ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <h2 className="font-display mb-1 text-3xl font-black text-foreground">
        {section.title}
      </h2>
      <p className="mb-6 text-muted-foreground">{section.question}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {section.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              selected[section.key].includes(tag)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      <textarea
        value={texts[section.key]}
        onChange={(e) => setTexts((prev) => ({ ...prev, [section.key]: e.target.value }))}
        placeholder="Add your own thoughts (optional)..."
        rows={3}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      <div className="mt-6 flex gap-3">
        {sectionIdx > 0 && (
          <button
            type="button"
            onClick={() => setSectionIdx((i) => i - 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {isLast ? "Save & Continue" : "Next"} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint check**

```bash
bun biome check app/\(pwa\)/onboarding/mentee/assessment/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(pwa\)/onboarding/mentee/ && git commit -m "feat: add mentee assessment onboarding page"
```

---

## Task 5: Mentee onboarding — values + personality + profile pages

**Files:**
- Create: `app/(pwa)/onboarding/mentee/values/page.tsx`
- Create: `app/(pwa)/onboarding/mentee/personality/page.tsx`
- Create: `app/(pwa)/onboarding/mentee/profile/page.tsx`

- [ ] **Step 1: Create values ranking page**

Create `app/(pwa)/onboarding/mentee/values/page.tsx`:

```tsx
"use client";

import { ArrowRight, GripVertical } from "lucide-react";
import { useState, useTransition } from "react";
import { saveMenteeValues } from "../../actions";

const DEFAULT_VALUES = ["Integrity", "Service", "Creativity", "Leadership", "Family", "Innovation"];

export default function ValuesPage() {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<number | null>(null);

  function moveUp(i: number) {
    if (i === 0) return;
    setValues((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    if (i === values.length - 1) return;
    setValues((prev) => {
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        What do you value most?
      </h2>
      <p className="mb-8 text-muted-foreground">
        Drag or tap the arrows to rank these values — most important at the top.
      </p>

      <div className="space-y-2">
        {values.map((value, i) => (
          <div
            key={value}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium text-foreground">{value}</span>
            <span className="text-xs font-bold text-primary">#{i + 1}</span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="rounded px-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === values.length - 1}
                className="rounded px-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => saveMenteeValues(values))}
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create personality page**

Create `app/(pwa)/onboarding/mentee/personality/page.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveMenteePersonality } from "../../actions";

const SCALES = [
  { key: "introvertExtrovert" as const, left: "Introvert", right: "Extrovert", leftDesc: "I recharge alone", rightDesc: "I recharge with others" },
  { key: "structuredFlexible" as const, left: "Structured", right: "Flexible", leftDesc: "I like plans and routines", rightDesc: "I adapt as I go" },
  { key: "creativeAnalytical" as const, left: "Creative", right: "Analytical", leftDesc: "I think in ideas", rightDesc: "I think in logic" },
  { key: "independentCollaborative" as const, left: "Independent", right: "Collaborative", leftDesc: "I work best alone", rightDesc: "I thrive in teams" },
];

type Scores = {
  introvertExtrovert: number;
  structuredFlexible: number;
  creativeAnalytical: number;
  independentCollaborative: number;
};

export default function PersonalityPage() {
  const [scores, setScores] = useState<Scores>({
    introvertExtrovert: 3,
    structuredFlexible: 3,
    creativeAnalytical: 3,
    independentCollaborative: 3,
  });
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        How do you work best?
      </h2>
      <p className="mb-8 text-muted-foreground">
        Slide each bar to where you naturally fall. There are no right answers.
      </p>

      <div className="space-y-8">
        {SCALES.map((scale) => (
          <div key={scale.key}>
            <div className="mb-3 flex justify-between text-sm font-semibold text-foreground">
              <span>{scale.left}</span>
              <span>{scale.right}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={scores[scale.key]}
              onChange={(e) =>
                setScores((prev) => ({ ...prev, [scale.key]: Number(e.target.value) }))
              }
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{scale.leftDesc}</span>
              <span>{scale.rightDesc}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => saveMenteePersonality(scores))}
        disabled={isPending}
        className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create purpose profile reveal page**

Create `app/(pwa)/onboarding/mentee/profile/page.tsx`:

```tsx
"use client";

import { Check, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { completeMenteeOnboarding } from "../../actions";

export default function MenteeProfilePage() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-6 text-7xl">🌱</div>
      <h2 className="font-display mb-3 text-4xl font-black text-foreground">
        You&apos;re an Explorer!
      </h2>
      <p className="mb-2 text-lg font-semibold text-primary">Level 1</p>
      <p className="mb-10 max-w-md text-muted-foreground">
        We&apos;ve used your answers to build your Purpose Profile. Your personalised
        dashboard and mentor matches are ready.
      </p>

      <div className="mb-8 w-full rounded-2xl border border-border bg-card p-6 text-left">
        <p className="mb-4 text-sm font-semibold text-foreground">
          Your first milestones
        </p>
        <ul className="space-y-2">
          {[
            { label: "Complete the Purpose Quiz", done: true },
            { label: "Get matched with a mentor", done: false },
            { label: "Write your first journal entry", done: false },
            { label: "Complete the Safety Module", done: false },
          ].map((m) => (
            <li key={m.label} className="flex items-center gap-3 text-sm">
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded-full ${m.done ? "bg-primary" : "border-2 border-dashed border-border"}`}
              >
                {m.done && <Check className="size-3 text-primary-foreground" />}
              </div>
              <span className={m.done ? "text-foreground" : "text-muted-foreground"}>
                {m.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => completeMenteeOnboarding())}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : "Go to My Dashboard"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Lint and type check**

```bash
bun biome check app/\(pwa\)/onboarding/mentee/ && bun run build 2>&1 | grep -E "error" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\(pwa\)/onboarding/mentee/ && git commit -m "feat: add mentee values, personality, and profile reveal onboarding pages"
```

---

## Task 6: Mentor onboarding pages

**Files:**
- Create: `app/(pwa)/onboarding/mentor/profile/page.tsx`
- Create: `app/(pwa)/onboarding/mentor/pricing/page.tsx`
- Create: `app/(pwa)/onboarding/mentor/verification/page.tsx`

- [ ] **Step 1: Create mentor profile page**

Create `app/(pwa)/onboarding/mentor/profile/page.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveMentorProfile } from "../../actions";

const EXPERTISE_TAGS = ["Leadership", "Technology", "Business", "Healthcare", "Education", "Arts", "Finance", "Engineering", "Law", "Media", "Agriculture", "Science"];
const LANGUAGES = ["English", "Krio", "Temne", "Mende", "French", "Arabic"];

export default function MentorProfilePage() {
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [industry, setIndustry] = useState("");
  const [years, setYears] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [location, setLocation] = useState("");
  const [isPending, startTransition] = useTransition();

  const canContinue = bio.trim().length > 20 && expertise.length > 0 && industry && years && location;

  function toggleTag(tag: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  function handleSubmit() {
    if (!canContinue) return;
    startTransition(() =>
      saveMentorProfile({
        bio,
        expertise,
        industry,
        yearsExperience: Number(years),
        languages,
        location,
      }),
    );
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Your mentor profile
      </h2>
      <p className="mb-8 text-muted-foreground">
        Tell mentees about yourself. This becomes your public profile.
      </p>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Bio <span className="text-muted-foreground">(min 20 characters)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Share your background, expertise, and what drives you to mentor..."
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Areas of expertise
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag, expertise, setExpertise)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  expertise.includes(tag)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Technology"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Years of experience</label>
            <input
              type="number"
              min={0}
              max={50}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleTag(lang, languages, setLanguages)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  languages.includes(lang)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Freetown"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canContinue || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create mentor pricing page**

Create `app/(pwa)/onboarding/mentor/pricing/page.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveMentorPricing } from "../../actions";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PACKAGE_TYPES = ["1-on-1 Sessions", "Group Sessions", "Both"];

export default function MentorPricingPage() {
  const [hourlyRate, setHourlyRate] = useState("");
  const [packageType, setPackageType] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const canContinue = hourlyRate && packageType && availability.length > 0;

  function toggleDay(day: string) {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Pricing & availability
      </h2>
      <p className="mb-8 text-muted-foreground">
        Set your session rate and when you are available.
      </p>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Hourly rate (NLE)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">NLE</span>
            <input
              type="number"
              min={0}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g. 50000"
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter 0 for pro bono / scholarship mentoring
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Session type
          </label>
          <div className="space-y-2">
            {PACKAGE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPackageType(type)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                  packageType === type
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Available days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  availability.includes(day)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          startTransition(() =>
            saveMentorPricing({
              hourlyRate: Number(hourlyRate),
              packageTypes: packageType ? [packageType] : [],
              availability,
            }),
          )
        }
        disabled={!canContinue || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create mentor verification page**

Create `app/(pwa)/onboarding/mentor/verification/page.tsx`:

```tsx
"use client";

import { FileText, IdCard, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { submitMentorVerification } from "../../actions";

export default function MentorVerificationPage() {
  const [statement, setStatement] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Identity verification
      </h2>
      <p className="mb-2 text-muted-foreground">
        We verify all mentors to keep the platform safe. This is reviewed by
        our admin team within 48 hours.
      </p>

      <div className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">What happens next</p>
        <p className="mt-1">
          After you submit, your profile is created. You can explore the
          platform but cannot be matched with mentees until our team approves
          your application.
        </p>
      </div>

      <div className="space-y-4">
        {/* File upload placeholders — storage integration is a future task */}
        <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border p-5">
          <IdCard className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">Government ID</p>
            <p className="text-sm text-muted-foreground">
              National ID, passport, or driver&apos;s licence
            </p>
            <p className="mt-1 text-xs text-primary">
              File upload coming soon — our team will contact you via email
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border p-5">
          <FileText className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">CV / Resume</p>
            <p className="text-sm text-muted-foreground">
              PDF or Word document
            </p>
            <p className="mt-1 text-xs text-primary">
              File upload coming soon — our team will contact you via email
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Personal statement
          </label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={4}
            placeholder="Why do you want to mentor young people? What do you hope to contribute?"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => submitMentorVerification())}
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Submit Application"
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Lint check**

```bash
bun biome check app/\(pwa\)/onboarding/mentor/
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\(pwa\)/onboarding/mentor/ && git commit -m "feat: add mentor onboarding pages (profile, pricing, verification)"
```

---

## Task 7: Parent onboarding pages

**Files:**
- Create: `app/(pwa)/onboarding/parent/profile/page.tsx`
- Create: `app/(pwa)/onboarding/parent/link/page.tsx`

- [ ] **Step 1: Create parent profile page**

Create `app/(pwa)/onboarding/parent/profile/page.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveParentProfile } from "../../actions";

const RELATIONSHIPS = ["Parent", "Guardian", "Grandparent", "Aunt / Uncle", "Older Sibling", "Other"];

export default function ParentProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [relationship, setRelationship] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();

  const canContinue = displayName.trim().length > 1 && relationship && phone.trim().length > 6;

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Your details
      </h2>
      <p className="mb-8 text-muted-foreground">
        Tell us a little about yourself so we can set up your guardian account.
      </p>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Full name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-foreground">
            Relationship to child
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRelationship(r)}
                className={cn(
                  "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                  relationship === r
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Contact phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+232 76 000 000"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          startTransition(() =>
            saveParentProfile({ displayName, relationship: relationship!, phone }),
          )
        }
        disabled={!canContinue || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create parent link page**

Create `app/(pwa)/onboarding/parent/link/page.tsx`:

```tsx
"use client";

import { ArrowRight, Copy, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveParentLink } from "../../actions";

export default function ParentLinkPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Link your child&apos;s account
      </h2>
      <p className="mb-8 text-muted-foreground">
        Enter the email address your child used (or will use) to sign up for
        Ikigai.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Child&apos;s email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="child@example.com"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">How this works</p>
          <ul className="mt-2 space-y-1">
            <li>• If your child already has an account, they will be linked automatically.</li>
            <li>• If not, you will receive an invite code to share with them.</li>
            <li>• You can start exploring your parent dashboard right away.</li>
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          startTransition(() => saveParentLink(email))
        }
        disabled={!email.includes("@") || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <>Link Account <ArrowRight className="size-4" /></>}
      </button>

      <button
        type="button"
        onClick={() => startTransition(() => saveParentLink(""))}
        disabled={isPending}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-border px-8 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
      >
        Skip for now
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Lint check**

```bash
bun biome check app/\(pwa\)/onboarding/parent/
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(pwa\)/onboarding/parent/ && git commit -m "feat: add parent onboarding pages (profile, link child)"
```

---

## Task 8: (app)/layout.tsx — resume logic + route guards

**Files:**
- Rewrite: `app/(pwa)/(app)/layout.tsx`

- [ ] **Step 1: Rewrite the app layout**

Rewrite `app/(pwa)/(app)/layout.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { LiteModeInit } from "@/components/lite-mode-init";
import { PwaGate } from "@/components/pwa-gate";
import { getOrCreateDbUser } from "@/lib/db-user";

type OnboardingData = {
  roleSelected?: boolean;
  purposeProfile?: unknown;
  verificationSubmitted?: boolean;
  childLinked?: boolean;
  inviteCode?: string;
  childEmail?: string;
};

function getMenteeNextStep(data: OnboardingData): string {
  if (!data.roleSelected) return "/onboarding";
  const d = data as Record<string, unknown>;
  if (!d.assessment) return "/onboarding/mentee/assessment";
  if (!d.valuesRanking) return "/onboarding/mentee/values";
  if (!d.personality) return "/onboarding/mentee/personality";
  return "/onboarding/mentee/profile";
}

function getMentorNextStep(data: OnboardingData): string {
  if (!data.roleSelected) return "/onboarding";
  const d = data as Record<string, unknown>;
  if (!d.mentorProfile) return "/onboarding/mentor/profile";
  if (!d.mentorPricing) return "/onboarding/mentor/pricing";
  return "/onboarding/mentor/verification";
}

function getParentNextStep(data: OnboardingData): string {
  if (!data.roleSelected) return "/onboarding";
  const d = data as Record<string, unknown>;
  if (!d.parentProfile) return "/onboarding/parent/profile";
  return "/onboarding/parent/link";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateDbUser();
  const data = (user.onboardingData as OnboardingData | null) ?? {};

  // Resume logic: redirect to the correct onboarding step if not complete.
  // Role-specific route guards (e.g. mentor-portal requires mentor role) live
  // in each individual page — Next.js server layouts cannot read pathname.
  if (user.role === "mentee" || user.role === "club_lead" || !user.role) {
    if (!data.purposeProfile) {
      redirect(getMenteeNextStep(data));
    }
  } else if (user.role === "mentor") {
    if (!data.verificationSubmitted) {
      redirect(getMentorNextStep(data));
    }
  } else if (user.role === "parent") {
    if (!data.childLinked && !data.inviteCode) {
      redirect(getParentNextStep(data));
    }
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <LiteModeInit />
      <PwaGate />
      <AppSidebar role={user.role} displayName={user.displayName} />
      <div className="min-w-0 flex-1 pb-16 lg:overflow-y-auto lg:pb-0">
        {children}
      </div>
      <AppNav role={user.role} />
    </div>
  );
}
```

- [ ] **Step 2: Type check**

```bash
bun run build 2>&1 | grep -E "error" | grep "layout" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(pwa\)/\(app\)/layout.tsx && git commit -m "feat: add resume logic and role-based route guards to app layout"
```

---

## Task 9: Role-aware AppNav + AppSidebar

**Files:**
- Rewrite: `components/app-nav.tsx`
- Rewrite: `components/app-sidebar.tsx`

- [ ] **Step 1: Rewrite AppNav**

Rewrite `components/app-nav.tsx`:

```tsx
"use client";

import {
  BookOpen,
  Calendar,
  CreditCard,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Star,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const MENTEE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: TreePine },
  { href: "/mentorship", label: "Match", icon: Users },
  { href: "/journal", label: "Journal", icon: BookOpen },
];

const MENTOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mentor-portal", label: "Mentees", icon: Users },
  { href: "/mentorship", label: "Messages", icon: MessageCircle },
  { href: "/activities", label: "Activities", icon: Calendar },
];

const PARENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/parent-portal", label: "My Child", icon: Heart },
  { href: "/parent-portal/mentors", label: "Mentors", icon: Star },
  { href: "/parent-portal/payments", label: "Payments", icon: CreditCard },
];

function navItemsForRole(role: string | null): NavItem[] {
  if (role === "mentor") return MENTOR_NAV;
  if (role === "parent") return PARENT_NAV;
  return MENTEE_NAV;
}

export function AppNav({ role }: { role: string | null }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);
  const isProfileActive = pathname === "/settings" || pathname.startsWith("/settings/");

  // Derive initials from first letter of role for avatar
  const roleLabel = role === "mentor" ? "M" : role === "parent" ? "P" : "U";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-5", isActive && "fill-primary/10")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
            isProfileActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px] font-bold leading-none",
              isProfileActive
                ? "bg-primary text-primary-foreground"
                : "bg-primary-muted/50 text-primary",
            )}
          >
            {roleLabel}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite AppSidebar**

Rewrite `components/app-sidebar.tsx`:

```tsx
"use client";

import { useClerk } from "@clerk/nextjs";
import {
  BookOpen,
  Calendar,
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Shield,
  Star,
  TreePine,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const MENTEE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: TreePine },
  { href: "/mentorship", label: "Match", icon: Users },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Star },
];

const MENTEE_MODULES: NavItem[] = [
  { href: "/pad-her-power", label: "Pad Her Power", icon: Zap },
  { href: "/safety", label: "Safety", icon: Shield },
];

const MENTOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mentor-portal", label: "My Mentees", icon: Users },
  { href: "/mentorship", label: "Messages", icon: MessageCircle },
  { href: "/activities", label: "Activities", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Star },
];

const PARENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/parent-portal", label: "My Child", icon: Heart },
  { href: "/parent-portal/mentors", label: "Mentors", icon: Star },
  { href: "/parent-portal/payments", label: "Payments", icon: CreditCard },
  { href: "/activities", label: "Activities", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Star },
];

function navForRole(role: string | null): { main: NavItem[]; modules?: NavItem[] } {
  if (role === "mentor") return { main: MENTOR_NAV };
  if (role === "parent") return { main: PARENT_NAV };
  return { main: MENTEE_NAV, modules: MENTEE_MODULES };
}

export function AppSidebar({
  role,
  displayName,
}: {
  role: string | null;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { main, modules } = navForRole(role);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const initials = (displayName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel =
    role === "mentor" ? "Mentor" : role === "parent" ? "Parent" : "Mentee";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="font-display text-xl font-black text-primary">Ikigai</span>
        <span className="text-lg">🌱</span>
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{greeting}</p>
            <p className="text-sm font-semibold leading-tight text-foreground">
              {displayName ?? roleLabel}
            </p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {main.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className={cn("size-4", isActive && "fill-primary/10")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {modules && modules.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Modules
            </p>
            <div className="space-y-0.5">
              {modules.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Lint check**

```bash
bun biome check components/app-nav.tsx components/app-sidebar.tsx
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/app-nav.tsx components/app-sidebar.tsx && git commit -m "feat: make AppNav and AppSidebar role-aware (mentee/mentor/parent)"
```

---

## Task 10: Dashboard — role-specific views

**Files:**
- Modify: `app/(pwa)/(app)/dashboard/page.tsx`
- Rewrite: `app/(pwa)/(app)/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Update dashboard/page.tsx to pass role**

The page already fetches user + mentorship + journal + milestones. Add role-specific mentor data fetch. Replace the file:

```tsx
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { journalEntries, mentorships, milestones, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  if (user.role === "mentee" || user.role === "club_lead" || !user.role) {
    const [activeMentorshipRows, latestEntryRows, milestoneRows] =
      await Promise.all([
        db
          .select({
            id: mentorships.id,
            status: mentorships.status,
            matchScore: mentorships.matchScore,
            lastActivityAt: mentorships.lastActivityAt,
            mentorId: mentorships.mentorId,
          })
          .from(mentorships)
          .where(eq(mentorships.menteeId, user.id))
          .limit(1),
        db
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.userId, user.id))
          .orderBy(desc(journalEntries.createdAt))
          .limit(1),
        db.select({ id: milestones.id }).from(milestones).where(eq(milestones.userId, user.id)),
      ]);

    const mentorshipRow = activeMentorshipRows[0] ?? null;
    let mentor = null;
    if (mentorshipRow?.mentorId) {
      const [m] = await db
        .select({ displayName: users.displayName, bio: users.bio, interestTags: users.interestTags })
        .from(users)
        .where(eq(users.id, mentorshipRow.mentorId))
        .limit(1);
      mentor = m ?? null;
    }

    return (
      <DashboardClient
        role="mentee"
        user={{ displayName: user.displayName ?? "User", growthLevel: user.growthLevel ?? 1 }}
        menteeData={{
          activeMentorship: mentorshipRow
            ? {
                id: mentorshipRow.id,
                status: mentorshipRow.status,
                matchScore: mentorshipRow.matchScore,
                lastActivityAt: mentorshipRow.lastActivityAt?.toISOString() ?? null,
                mentor,
              }
            : null,
          latestEntry: latestEntryRows[0]
            ? {
                content: latestEntryRows[0].content,
                createdAt: latestEntryRows[0].createdAt?.toISOString() ?? new Date().toISOString(),
                visibility: latestEntryRows[0].visibility ?? "private",
              }
            : null,
          milestoneCount: milestoneRows.length,
        }}
      />
    );
  }

  if (user.role === "mentor") {
    const activeMenteeships = await db
      .select({
        id: mentorships.id,
        status: mentorships.status,
        lastActivityAt: mentorships.lastActivityAt,
        menteeId: mentorships.menteeId,
      })
      .from(mentorships)
      .where(eq(mentorships.mentorId, user.id))
      .limit(10);

    return (
      <DashboardClient
        role="mentor"
        user={{ displayName: user.displayName ?? "Mentor", growthLevel: 1 }}
        mentorData={{
          activeMenteeships: activeMenteeships.map((m) => ({
            id: m.id,
            status: m.status,
            lastActivityAt: m.lastActivityAt?.toISOString() ?? null,
            menteeId: m.menteeId,
          })),
          isVerified: !!user.verifiedAt,
        }}
      />
    );
  }

  // Parent
  const onboardingData = (user.onboardingData as Record<string, unknown> | null) ?? {};

  return (
    <DashboardClient
      role="parent"
      user={{ displayName: user.displayName ?? "Parent", growthLevel: 1 }}
      parentData={{
        childEmail: (onboardingData.childEmail as string | null) ?? null,
        childLinked: !!(onboardingData.childLinked as boolean | null),
        inviteCode: (onboardingData.inviteCode as string | null) ?? null,
      }}
    />
  );
}
```

- [ ] **Step 2: Rewrite dashboard-client.tsx**

```tsx
"use client";

import { BookOpen, ChevronRight, MessageCircle, TreePine, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

// ── Types ───────────────────────────────────────────────────────────────────

type Mentor = { displayName: string | null; bio: string | null; interestTags: string[] | null } | null;

type MenteeData = {
  activeMentorship: {
    id: string;
    status: string | null;
    matchScore: number | null;
    lastActivityAt: string | null;
    mentor: Mentor;
  } | null;
  latestEntry: { content: string; createdAt: string; visibility: string } | null;
  milestoneCount: number;
};

type MentorData = {
  activeMenteeships: { id: string; status: string | null; lastActivityAt: string | null; menteeId: string | null }[];
  isVerified: boolean;
};

type ParentData = {
  childEmail: string | null;
  childLinked: boolean;
  inviteCode: string | null;
};

type Props =
  | { role: "mentee"; user: { displayName: string; growthLevel: number }; menteeData: MenteeData; mentorData?: never; parentData?: never }
  | { role: "mentor"; user: { displayName: string; growthLevel: number }; mentorData: MentorData; menteeData?: never; parentData?: never }
  | { role: "parent"; user: { displayName: string; growthLevel: number }; parentData: ParentData; menteeData?: never; mentorData?: never };

// ── Root ────────────────────────────────────────────────────────────────────

export function DashboardClient(props: Props) {
  if (props.role === "mentor") return <MentorView user={props.user} data={props.mentorData} />;
  if (props.role === "parent") return <ParentView user={props.user} data={props.parentData} />;
  return <MenteeView user={props.user} data={props.menteeData} />;
}

// ── Mentee ──────────────────────────────────────────────────────────────────

function MenteeView({ user, data }: { user: { displayName: string; growthLevel: number }; data: MenteeData }) {
  const nextLevelMilestones = 6;

  return (
    <>
      <PageHeader showGreeting />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          {/* Growth Level Card */}
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-muted">Growth Level</p>
                <p className="font-display text-2xl font-black">
                  Explorer — Level {user.growthLevel}
                </p>
              </div>
              <TreePine className="size-10 text-primary-muted/50" />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-primary-muted">
                <span>Progress to Advocate</span>
                <span>{data.milestoneCount} / {nextLevelMilestones} milestones</span>
              </div>
              <div className="h-2 w-full rounded-full bg-primary-muted/30">
                <div
                  className="h-2 rounded-full bg-primary-foreground transition-all"
                  style={{ width: `${Math.min((data.milestoneCount / nextLevelMilestones) * 100, 100)}%` }}
                />
              </div>
            </div>
            <Link
              href="/journey"
              className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-muted hover:text-primary-foreground"
            >
              View Growth Tree <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Milestones", value: String(data.milestoneCount) },
              { label: "Level", value: String(user.growthLevel) },
              { label: "Mentor", value: data.activeMentorship ? "Active" : "None" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Mentor Card */}
          {data.activeMentorship?.mentor ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Mentor</p>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                  {data.activeMentorship.mentor.displayName?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "M"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{data.activeMentorship.mentor.displayName}</p>
                  <p className="text-xs text-muted-foreground">{data.activeMentorship.mentor.interestTags?.join(", ")}</p>
                </div>
                <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-xs font-medium text-primary">
                  {data.activeMentorship.status}
                </span>
              </div>
              <Link
                href={`/mentorship/${data.activeMentorship.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                <MessageCircle className="size-4" /> Send a message
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mentorship</p>
              <p className="text-sm text-muted-foreground">You don&apos;t have a mentor yet.</p>
              <Link
                href="/mentorship"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Find a Mentor
              </Link>
            </div>
          )}

          {/* Modules */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Modules</p>
            <div className="space-y-3">
              {[
                { href: "/pad-her-power", icon: "💚", title: "Pad Her Power" },
                { href: "/safety", icon: "🛡️", title: "Safety Awareness" },
              ].map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <span className="text-2xl">{mod.icon}</span>
                  <p className="flex-1 text-sm font-semibold text-foreground">{mod.title}</p>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Journal */}
          {data.latestEntry && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Journal</p>
                <Link href="/journal" className="text-xs font-medium text-primary">See all</Link>
              </div>
              <Link href="/journal" className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="size-3" />
                  <span>{new Date(data.latestEntry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>
                  <span>·</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{data.latestEntry.visibility.replace("_", " ")}</span>
                </div>
                <p className="line-clamp-2 text-sm text-foreground">{data.latestEntry.content}</p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Mentor ──────────────────────────────────────────────────────────────────

function MentorView({ user, data }: { user: { displayName: string; growthLevel: number }; data: MentorData }) {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          {/* Status Card */}
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="font-display text-2xl font-black">
              {user.displayName}
            </p>
            <p className="mt-1 text-sm text-primary-muted">
              {data.isVerified ? "✓ Verified Mentor" : "⏳ Application under review — you cannot be matched yet"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">{data.activeMenteeships.length}</p>
              <p className="text-xs text-muted-foreground">Active Mentees</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Sessions this month</p>
            </div>
          </div>

          {/* Mentees List */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Mentees</p>
            {data.activeMenteeships.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No active mentees yet.{" "}
                {!data.isVerified && "Your account is pending verification."}
              </div>
            ) : (
              <div className="space-y-3">
                {data.activeMenteeships.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mentor-portal/${m.menteeId}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                      M
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Mentee</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.status}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/mentor-portal"
            className="flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            <Users className="size-4" /> View all mentees
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Parent ───────────────────────────────────────────────────────────────────

function ParentView({ user, data }: { user: { displayName: string; growthLevel: number }; data: ParentData }) {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm text-primary-muted">Guardian Dashboard</p>
            <p className="font-display text-2xl font-black">{user.displayName}</p>
          </div>

          {/* Child link status */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My Child
            </p>
            {data.childLinked ? (
              <div>
                <p className="text-sm text-foreground">
                  ✓ Linked to <span className="font-semibold">{data.childEmail}</span>
                </p>
                <Link
                  href="/parent-portal"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  View progress
                </Link>
              </div>
            ) : data.inviteCode ? (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Invite sent to <span className="font-semibold">{data.childEmail}</span>
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Share this code with your child to link accounts:
                </p>
                <div className="rounded-xl border border-border bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
                  {data.inviteCode}
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm text-muted-foreground">
                  No child linked yet.
                </p>
                <Link
                  href="/onboarding/parent/link"
                  className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Link child&apos;s account
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/parent-portal/mentors" className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/40">
              <p className="text-2xl">🤝</p>
              <p className="mt-1 text-xs font-semibold text-foreground">Mentors</p>
            </Link>
            <Link href="/parent-portal/payments" className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/40">
              <p className="text-2xl">💳</p>
              <p className="mt-1 text-xs font-semibold text-foreground">Payments</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Lint and build check**

```bash
bun biome check app/\(pwa\)/\(app\)/dashboard/ && bun run build 2>&1 | grep -E "error" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(pwa\)/\(app\)/dashboard/ && git commit -m "feat: role-specific dashboards — no more tab switcher (mentee/mentor/parent)"
```

---

## Task 11: New portal and activity route stubs

**Files:**
- Create: `app/(pwa)/(app)/mentor-portal/page.tsx`
- Create: `app/(pwa)/(app)/mentor-portal/[menteeId]/page.tsx`
- Create: `app/(pwa)/(app)/parent-portal/page.tsx`
- Create: `app/(pwa)/(app)/parent-portal/mentors/page.tsx`
- Create: `app/(pwa)/(app)/parent-portal/payments/page.tsx`
- Create: `app/(pwa)/(app)/activities/page.tsx`
- Create: `app/(pwa)/(app)/activities/[id]/page.tsx`

These are structural stubs — they render a real UI shell with a "coming soon" body. The routes must exist and be navigable; full feature content is a future plan.

- [ ] **Step 1: Create mentor-portal/page.tsx**

```tsx
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorships } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

export default async function MentorPortalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "mentor") redirect("/dashboard");

  const rows = await db
    .select({ id: mentorships.id, status: mentorships.status, menteeId: mentorships.menteeId, lastActivityAt: mentorships.lastActivityAt })
    .from(mentorships)
    .where(eq(mentorships.mentorId, user.id));

  return (
    <>
      <PageHeader title="My Mentees" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No active mentees yet. Once your account is verified, mentees can connect with you.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((m) => (
              <Link
                key={m.id}
                href={`/mentor-portal/${m.menteeId}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                  M
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Mentee</p>
                  <p className="text-xs capitalize text-muted-foreground">{m.status} · Last active {m.lastActivityAt ? new Date(m.lastActivityAt).toLocaleDateString("en-GB") : "—"}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create mentor-portal/[menteeId]/page.tsx**

```tsx
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { db } from "@/db/db";
import { mentorships, milestones, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

export default async function MenteeDetailPage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const { menteeId } = await params;
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "mentor") redirect("/dashboard");

  const [mentee] = await db
    .select({ displayName: users.displayName, growthLevel: users.growthLevel, interestTags: users.interestTags })
    .from(users)
    .where(eq(users.id, menteeId))
    .limit(1);

  if (!mentee) redirect("/mentor-portal");

  const milestoneRows = await db
    .select({ type: milestones.type, completedAt: milestones.completedAt })
    .from(milestones)
    .where(eq(milestones.userId, menteeId));

  const [mentorship] = await db
    .select({ id: mentorships.id, status: mentorships.status })
    .from(mentorships)
    .where(eq(mentorships.menteeId, menteeId))
    .limit(1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/mentor-portal" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> My Mentees
      </Link>

      <div className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-xl font-bold">
          {mentee.displayName?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "M"}
        </div>
        <p className="mt-3 font-display text-2xl font-black">{mentee.displayName ?? "Mentee"}</p>
        <p className="text-sm text-primary-muted">Level {mentee.growthLevel ?? 1} · {milestoneRows.length} milestones</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Milestones</p>
          {milestoneRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            <div className="space-y-2">
              {milestoneRows.map((m) => (
                <div key={m.type} className="flex items-center gap-3 text-sm">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="flex-1 capitalize text-foreground">{m.type?.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">
                    {m.completedAt ? new Date(m.completedAt).toLocaleDateString("en-GB") : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {mentorship && (
          <Link
            href={`/mentorship/${mentorship.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <MessageCircle className="size-4" /> Open Chat
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create parent-portal/page.tsx**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentPortalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  const data = (user.onboardingData as Record<string, unknown> | null) ?? {};
  const childLinked = !!(data.childLinked as boolean | null);
  const inviteCode = (data.inviteCode as string | null) ?? null;
  const childEmail = (data.childEmail as string | null) ?? null;

  return (
    <>
      <PageHeader title="My Child" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Child Account</p>
            {childLinked ? (
              <p className="text-sm text-foreground">✓ Linked to <span className="font-semibold">{childEmail}</span></p>
            ) : inviteCode ? (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Awaiting your child to join with invite code:</p>
                <div className="rounded-xl bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">{inviteCode}</div>
              </div>
            ) : (
              <Link href="/onboarding/parent/link" className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
                Link child&apos;s account
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/parent-portal/mentors" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
              <Star className="size-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Mentors</p>
              <p className="text-xs text-muted-foreground">Browse &amp; approve</p>
            </Link>
            <Link href="/parent-portal/payments" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
              <CreditCard className="size-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Payments</p>
              <p className="text-xs text-muted-foreground">Manage billing</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Create parent-portal/mentors/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentMentorsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  return (
    <>
      <PageHeader title="Mentors" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Mentor browsing and approval for parents is coming soon.
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create parent-portal/payments/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentPaymentsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  return (
    <>
      <PageHeader title="Payments" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Payment management is coming soon. Mentorship subscriptions and one-time packages will appear here.
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Create activities/page.tsx**

```tsx
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";
import { redirect } from "next/navigation";

export default async function ActivitiesPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <PageHeader title="Activities" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-3xl">📅</p>
          <p className="mt-3 font-semibold text-foreground">Activity Hub</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Workshops, networking events, wellness sessions, and leadership camps will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 7: Create activities/[id]/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getDbUser } from "@/lib/db-user";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/activities" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Activities
      </Link>
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Activity detail page coming soon.
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Lint check**

```bash
bun biome check app/\(pwa\)/\(app\)/mentor-portal/ app/\(pwa\)/\(app\)/parent-portal/ app/\(pwa\)/\(app\)/activities/
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/\(pwa\)/\(app\)/mentor-portal/ app/\(pwa\)/\(app\)/parent-portal/ app/\(pwa\)/\(app\)/activities/ && git commit -m "feat: add mentor-portal, parent-portal, and activities route stubs"
```

---

## Task 12: Delete school pages + final build check

**Files:**
- Delete: `app/(pwa)/(app)/school/page.tsx`
- Delete: `app/(pwa)/(app)/school/register-form.tsx`
- Delete: `app/(pwa)/(app)/school/actions.ts`

- [ ] **Step 1: Delete school directory**

```bash
rm -rf app/\(pwa\)/\(app\)/school/
```

- [ ] **Step 2: Full build check**

```bash
bun run build 2>&1 | tail -30
```

Expected: build succeeds with no TypeScript errors. If errors reference school imports, grep for them and remove.

```bash
grep -r "school" app/\(pwa\) --include="*.tsx" --include="*.ts" -l
```

Any remaining references should be in files you did not intend to change — review and remove school links from nav if any remain (the new AppNav and AppSidebar no longer include `/school`).

- [ ] **Step 3: Lint entire PWA**

```bash
bun biome check app/\(pwa\)/ components/app-nav.tsx components/app-sidebar.tsx
```

Expected: no errors. Fix any issues before committing.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: delete school pages — club_lead role removed from PWA UI"
```

- [ ] **Step 5: Push**

```bash
git push
```

Expected: branch pushed to origin/main with all 12 task commits.

---

## Verification Checklist

After all tasks complete, manually verify these flows work end-to-end in the dev server (`bun dev`):

- [ ] New user → `/onboarding` → role picker shows mentee / mentor / parent
- [ ] Select Mentee → `/onboarding/mentee/assessment` → progress bar shows Step 1 of 4
- [ ] Complete all 4 mentee steps → lands on `/dashboard` with mentee view (no tab switcher)
- [ ] Select Mentor → 3-step flow → lands on `/dashboard` with pending banner
- [ ] Select Parent → 2-step flow → lands on `/parent-portal`
- [ ] Mentor user: bottom nav shows Home · Mentees · Messages · Activities · Profile
- [ ] Parent user: bottom nav shows Home · My Child · Mentors · Payments · Profile
- [ ] Mentee visiting `/mentor-portal` → redirected to `/dashboard`
- [ ] `/activities` accessible to all roles
- [ ] `/school` returns 404
