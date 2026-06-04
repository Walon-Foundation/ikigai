# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the marketing homepage hero and cards — light editorial hero with watermark + yellow highlight, reusable glow-fill card component, numbered card labels replacing the old left-border pattern.

**Architecture:** Three file changes. First create the reusable `GlowCard` component, then rewrite `hero.tsx` in isolation, then swap the card markup in `page.tsx` to use `GlowCard`. No changes to any other marketing pages, the `GrowthTree` component, or the PWA/admin surfaces.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, framer-motion (already installed), TypeScript.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/marketing/glow-card.tsx` | Reusable pastel card with radial glow overlay on hover |
| Modify | `app/(marketing)/hero.tsx` | Full redesign: light bg, watermark, eyebrow, highlight span, new tree panel |
| Modify | `app/(marketing)/page.tsx` | Swap ProblemSection + PlatformSection cards to use `GlowCard` |

---

## Task 1: Create `GlowCard` component

**Files:**
- Create: `components/marketing/glow-card.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/marketing/glow-card.tsx

interface GlowCardProps {
  num: string;
  title: string;
  body: string;
  variant: "green" | "amber" | "earth" | "sage";
  className?: string;
}

const VARIANTS = {
  green: {
    bg: "oklch(0.96 0.02 154)",
    glow: "rgba(26, 92, 58, 0.22)",
    border: "border-primary/10",
    ring: "hover:ring-2 hover:ring-primary/20",
    label: "text-primary",
  },
  amber: {
    bg: "oklch(0.97 0.03 75)",
    glow: "rgba(245, 166, 35, 0.28)",
    border: "border-accent/10",
    ring: "hover:ring-2 hover:ring-accent/20",
    label: "text-accent",
  },
  earth: {
    bg: "oklch(0.96 0.025 35)",
    glow: "rgba(192, 92, 58, 0.22)",
    border: "border-earth/10",
    ring: "hover:ring-2 hover:ring-earth/20",
    label: "text-earth",
  },
  sage: {
    bg: "oklch(0.96 0.02 155)",
    glow: "rgba(46, 139, 87, 0.22)",
    border: "border-primary-light/10",
    ring: "hover:ring-2 hover:ring-primary-light/20",
    label: "text-primary-light",
  },
} as const;

export function GlowCard({ num, title, body, variant, className }: GlowCardProps) {
  const v = VARIANTS[variant];
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border transition-transform duration-200 hover:-translate-y-1 ${v.border} ${v.ring} ${className ?? ""}`}
      style={{ background: v.bg }}
    >
      {/* Radial glow overlay — blooms from bottom-left on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 10% 90%, ${v.glow} 0%, transparent 65%)`,
        }}
      />
      <div className="relative z-10 flex flex-1 flex-col p-5">
        <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-widest ${v.label}`}>
          {num}
        </p>
        <h3 className="font-display mb-3 text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/walon/Code/ikigai && bunx tsc --noEmit 2>&1 | grep -v ".next/dev/types" | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/glow-card.tsx
git commit -m "feat: add GlowCard marketing component with radial glow hover"
```

---

## Task 2: Rewrite `hero.tsx`

**Files:**
- Modify: `app/(marketing)/hero.tsx` (full replacement)

- [ ] **Step 1: Replace the entire file with this content**

```tsx
"use client";

import { motion } from "framer-motion";
import { GrowthTree } from "@/components/growth-tree";

const APP_URL = `https://${process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.ikigai.app"}`;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-40">
      {/* Watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none font-black leading-none text-border/60"
        style={{ fontSize: "clamp(120px, 18vw, 220px)", letterSpacing: "-0.06em" }}
      >
        IK
      </span>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left: text */}
          <div>
            {/* Eyebrow — yellow dot + label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 flex items-center gap-2"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Sierra Leone · Youth Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-display mb-6 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl"
            >
              To build a generation of confident,{" "}
              <span className="relative inline">
                purpose-driven
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-10 h-[10px] rounded-sm bg-accent/30"
                />
              </span>{" "}
              young people across Africa.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10 max-w-xl text-xl leading-relaxed text-muted-foreground"
            >
              Ikigai connects youth with verified mentors, purpose tools, and a
              community built for their future.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4"
            >
              <a
                href={APP_URL}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Install the App
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                How It Works →
              </a>
            </motion.div>
          </div>

          {/* Right: Growth Tree panel — desktop only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:justify-center"
          >
            <div className="relative w-full max-w-sm">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm">
                {/* Subtle radial glow at base of tree */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 100%, oklch(0.35 0.095 154 / 0.06) 0%, transparent 70%)",
                  }}
                />
                <GrowthTree completedCount={6} level={3} />
                <div className="mt-4 flex justify-center gap-8 border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-lg font-black text-primary">6</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Milestones
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-primary">Lv 3</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Level
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/walon/Code/ikigai && bunx tsc --noEmit 2>&1 | grep -v ".next/dev/types" | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/hero.tsx"
git commit -m "feat: redesign hero — light editorial, watermark, yellow highlight, new tree panel"
```

---

## Task 3: Update `page.tsx` — swap cards in ProblemSection and PlatformSection

**Files:**
- Modify: `app/(marketing)/page.tsx`

- [ ] **Step 1: Replace the entire file with this content**

```tsx
import { Footer } from "@/components/marketing/footer";
import { GlowCard } from "@/components/marketing/glow-card";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { SectionReveal } from "@/components/marketing/section-reveal";
import { Hero } from "./hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <PlatformSection />
        <StatsBar />
        <InstallCta
          headline="Ready to start your journey?"
          body="Young people across Sierra Leone are discovering their ikigai. Your story starts here."
        />
      </main>
      <Footer />
    </div>
  );
}

const PROBLEMS = [
  {
    num: "01 — Mentorship",
    title: "No trusted mentors",
    body: "Matching is random, progress is untracked, and mentors are difficult to verify — relationships fade without accountability.",
    variant: "green" as const,
  },
  {
    num: "02 — Guidance",
    title: "Limited guidance",
    body: "Career direction, purpose discovery, and accountability structures are missing for most young people in Sierra Leone.",
    variant: "amber" as const,
  },
  {
    num: "03 — Engagement",
    title: "Declining engagement",
    body: "Without structured programmes, mentorship relationships and personal development efforts lose momentum over time.",
    variant: "earth" as const,
  },
] as const;

function ProblemSection() {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              The Challenge
            </p>
            <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
              Young people face real barriers.
            </h2>
          </div>
        </SectionReveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <SectionReveal key={p.title} delay={i * 0.08}>
              <GlowCard
                num={p.num}
                title={p.title}
                body={p.body}
                variant={p.variant}
              />
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLATFORM_FEATURES = [
  {
    num: "01 — Matching",
    title: "AI Mentor Matching",
    body: "Top 5 mentors matched by your interests, values, personality, and career goals. Browse the marketplace and start with a 3-day icebreaker.",
    variant: "green" as const,
  },
  {
    num: "02 — Purpose",
    title: "Purpose Discovery",
    body: "Complete the Ikigai framework assessment and receive a personalised Purpose Profile and Purpose Statement written just for you.",
    variant: "amber" as const,
  },
  {
    num: "03 — Roadmap",
    title: "Growth Roadmap",
    body: "Four structured phases — Find Yourself, Build Yourself, Discover Purpose, Create Impact — visualised as your personal Growth Tree.",
    variant: "earth" as const,
  },
  {
    num: "04 — Access",
    title: "Flexible Plans",
    body: "Mentor subscriptions, one-time packages, and sponsored scholarships — no one gets left behind due to financial barriers.",
    variant: "sage" as const,
  },
] as const;

function PlatformSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Platform
            </p>
            <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
              Everything in one place.
            </h2>
          </div>
        </SectionReveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLATFORM_FEATURES.map((f, i) => (
            <SectionReveal key={f.title} delay={i * 0.08}>
              <GlowCard
                num={f.num}
                title={f.title}
                body={f.body}
                variant={f.variant}
              />
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "500", label: "Youth to reach" },
  { value: "200", label: "Mentors to verify" },
  { value: "50", label: "School clubs" },
] as const;

function StatsBar() {
  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-primary-muted/70">
          Year 1 Goals
        </p>
        <div className="grid grid-cols-3 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-5xl font-black text-primary-foreground">
                {s.value}
              </div>
              <div className="mt-1 text-sm font-medium text-primary-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/walon/Code/ikigai && bunx tsc --noEmit 2>&1 | grep -v ".next/dev/types" | head -20
```

Expected: zero errors.

- [ ] **Step 3: Lint**

```bash
cd /home/walon/Code/ikigai && bunx biome check "app/(marketing)/page.tsx" "app/(marketing)/hero.tsx" "components/marketing/glow-card.tsx" 2>&1 | tail -5
```

Expected: `No fixes applied.` or zero errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)/page.tsx"
git commit -m "feat: replace homepage cards with numbered GlowCard component"
```

---

## Task 4: Final verification

- [ ] **Step 1: Run the dev server**

```bash
cd /home/walon/Code/ikigai && bun dev
```

- [ ] **Step 2: Check homepage loads**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Expected: `200`

- [ ] **Step 3: Verify hero has no pill badge**

```bash
grep -n "For Youth\|rounded-full.*bg-primary-muted" "app/(marketing)/hero.tsx"
```

Expected: no output.

- [ ] **Step 4: Verify no old card pattern remains on homepage**

```bash
grep -n "rounded-r-2xl border-l-4" "app/(marketing)/page.tsx"
```

Expected: no output.

- [ ] **Step 5: Visual QA checklist**

Open `http://localhost:3000` in a browser and confirm:
- [ ] Hero has white/off-white background (not dark green)
- [ ] "IK" watermark visible faintly on the right
- [ ] Yellow dot + "Sierra Leone · Youth Platform" eyebrow text (no pill)
- [ ] "purpose-driven" has a yellow highlight wash behind it
- [ ] "Install the App" button is square-cornered and dark green
- [ ] "How It Works →" button is square-cornered with border
- [ ] GrowthTree panel is visible on wide viewport, white card with border
- [ ] Milestones/Level stats appear below the tree
- [ ] Problem section cards: tinted pastel backgrounds, numbered labels, glow on hover
- [ ] Platform section cards: same treatment, 2-column grid
- [ ] Stats bar is still dark green
- [ ] No TypeScript or console errors
