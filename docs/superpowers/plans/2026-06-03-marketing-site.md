# Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional, auth-free marketing site at `ikigai.app` — six pages (home, how-it-works, about, contact, privacy, terms) with premium minimal design, scroll-reveal animations, and a single CTA to install the PWA.

**Architecture:** All pages live under `app/(marketing)/`. Four shared components in `components/marketing/` (nav, footer, section-reveal, install-cta). Home page uses a mission-first layout. How It Works page has a custom alternating left/right scroll reveal. No Clerk, no auth, no emoji anywhere.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript — no additional dependencies needed.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `app/(marketing)/page.tsx` | Complete rewrite — mission-first homepage |
| Create | `components/marketing/nav.tsx` | Sticky navbar, scroll transparency, mobile drawer |
| Create | `components/marketing/footer.tsx` | 3-column footer, nav + legal links |
| Create | `components/marketing/section-reveal.tsx` | Scroll-triggered fade-up client wrapper |
| Create | `components/marketing/install-cta.tsx` | Reusable dark Install CTA block |
| Create | `app/(marketing)/how-it-works/page.tsx` | 5-step alternating scroll reveal page |
| Create | `app/(marketing)/about/page.tsx` | Vision, mission, who we serve |
| Create | `app/(marketing)/contact/page.tsx` | Page shell with ContactForm |
| Create | `app/(marketing)/contact/contact-form.tsx` | Client component — mailto form |
| Create | `app/(marketing)/privacy/page.tsx` | Privacy policy prose |
| Create | `app/(marketing)/terms/page.tsx` | Terms of service prose |

---

## Task 1: Shared components — Nav and Footer

**Files:**
- Create: `components/marketing/nav.tsx`
- Create: `components/marketing/footer.tsx`

- [ ] **Step 1: Add `NEXT_PUBLIC_APP_HOSTNAME` to `.env`**

Open `.env` and add this line (the file is gitignored so this is safe):
```
NEXT_PUBLIC_APP_HOSTNAME=app.localhost
```

- [ ] **Step 2: Create `components/marketing/nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const appUrl = `https://${process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.ikigai.app"}`;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-sm"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl font-black tracking-tight text-foreground">
              Ikigai
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-muted">
              Digital
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>

          {/* Right: Install CTA + mobile hamburger */}
          <div className="flex items-center gap-3">
            <a
              href={appUrl}
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98] sm:inline-flex"
            >
              Install the App
            </a>
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex flex-col gap-1.5 p-2 md:hidden"
              aria-label="Toggle menu"
            >
              <span
                className={cn(
                  "h-0.5 w-6 bg-foreground transition-transform duration-200",
                  open && "translate-y-2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-6 bg-foreground transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-6 bg-foreground transition-transform duration-200",
                  open && "-translate-y-2 -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="flex flex-col gap-4 border-t border-border bg-background px-6 pb-6 pt-4 md:hidden">
          <Link
            href="/how-it-works"
            onClick={() => setOpen(false)}
            className="border-b border-border py-2 text-base font-medium text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="border-b border-border py-2 text-base font-medium text-foreground"
          >
            About
          </Link>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="border-b border-border py-2 text-base font-medium text-foreground"
          >
            Contact
          </Link>
          <a
            href={appUrl}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Install the App
          </a>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 3: Create `components/marketing/footer.tsx`**

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Col 1 — Brand */}
          <div className="max-w-xs">
            <div className="mb-4 flex flex-col leading-none">
              <span className="font-display text-2xl font-black tracking-tight text-foreground">
                Ikigai
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-muted">
                Digital
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Empowering youth to discover purpose, build confidence, and
              prioritise mental wellness. Built for Sierra Leone.
            </p>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Platform
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/how-it-works"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Col 3 — Legal */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ikigai Digital. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Verify files exist**

```bash
ls components/marketing/
```
Expected: `footer.tsx  nav.tsx`

---

## Task 2: Shared components — SectionReveal and InstallCta

**Files:**
- Create: `components/marketing/section-reveal.tsx`
- Create: `components/marketing/install-cta.tsx`

- [ ] **Step 1: Create `components/marketing/section-reveal.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function SectionReveal({
  children,
  delay = 0,
  className,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/marketing/install-cta.tsx`**

```tsx
interface InstallCtaProps {
  headline: string;
  body: string;
}

export function InstallCta({ headline, body }: InstallCtaProps) {
  const appUrl = `https://${process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.ikigai.app"}`;

  return (
    <section className="bg-[#1C1C1A] py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display mb-5 text-4xl font-black text-[#FAFAF7] sm:text-5xl">
          {headline}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#A8A59F]">
          {body}
        </p>
        <a
          href={appUrl}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-semibold text-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Install the App — Free
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

```bash
ls components/marketing/
```
Expected: `footer.tsx  install-cta.tsx  nav.tsx  section-reveal.tsx`

---

## Task 3: Rewrite Home Page

**Files:**
- Modify: `app/(marketing)/page.tsx` (complete replacement)

- [ ] **Step 1: Replace `app/(marketing)/page.tsx` with this content**

```tsx
import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { SectionReveal } from "@/components/marketing/section-reveal";

const APP_URL = `https://${process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.ikigai.app"}`;

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

function Hero() {
  return (
    <section className="relative bg-primary pb-24 pt-40">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-block rounded-full bg-primary-muted/20 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary-muted">
          For Youth · Sierra Leone
        </div>
        <h1 className="font-display mb-6 text-5xl font-black leading-[1.05] tracking-tight text-primary-foreground sm:text-6xl md:text-7xl">
          To build a generation of confident, purpose-driven young people across
          Africa.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-primary-muted">
          Ikigai connects youth with verified mentors, purpose tools, and a
          community built for their future.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={APP_URL}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-semibold text-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Install the App
          </a>
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary-muted/40 px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:border-primary-muted"
          >
            How It Works →
          </a>
        </div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  {
    title: "No trusted mentors",
    body: "Matching is random, progress is untracked, and mentors are difficult to verify — relationships fade without accountability.",
    accent: "border-primary",
  },
  {
    title: "Limited guidance",
    body: "Career direction, purpose discovery, and accountability structures are missing for most young people in Sierra Leone.",
    accent: "border-accent",
  },
  {
    title: "Declining engagement",
    body: "Without structured programmes, mentorship relationships and personal development efforts lose momentum over time.",
    accent: "border-earth",
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
            <SectionReveal key={p.title} delay={i * 0.1}>
              <div
                className={`rounded-r-2xl border-l-4 bg-card px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${p.accent}`}
              >
                <h3 className="font-display mb-3 text-xl font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLATFORM_FEATURES = [
  {
    title: "AI Mentor Matching",
    body: "Top 5 mentors matched by your interests, values, personality, and career goals. Browse the marketplace and start with a 3-day icebreaker.",
    accent: "border-primary",
  },
  {
    title: "Purpose Discovery",
    body: "Complete the Ikigai framework assessment and receive a personalised Purpose Profile and Purpose Statement written just for you.",
    accent: "border-accent",
  },
  {
    title: "Growth Roadmap",
    body: "Four structured phases — Find Yourself, Build Yourself, Discover Purpose, Create Impact — visualised as your personal Growth Tree.",
    accent: "border-earth",
  },
  {
    title: "Flexible Plans",
    body: "Mentor subscriptions, one-time packages, and sponsored scholarships — no one gets left behind due to financial barriers.",
    accent: "border-primary-light",
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
              <div
                className={`rounded-r-2xl border-l-4 bg-card px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${f.accent}`}
              >
                <h3 className="font-display mb-3 text-xl font-bold text-foreground">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "500+", label: "Youth registered" },
  { value: "200+", label: "Verified mentors" },
  { value: "20+", label: "School clubs" },
] as const;

function StatsBar() {
  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-6">
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

- [ ] **Step 2: Verify the page has no Clerk or auth imports**

```bash
grep -n "clerk\|auth\|sign-in\|sign-up\|GrowthTree\|lucide" app/\(marketing\)/page.tsx
```
Expected: no output.

- [ ] **Step 3: Check the dev server loads the home page**

If the dev server is running at `localhost:3000`:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```
Expected: `200`

---

## Task 4: How It Works Page

**Files:**
- Create: `app/(marketing)/how-it-works/page.tsx`

- [ ] **Step 1: Create `app/(marketing)/how-it-works/page.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: "01",
    eyebrow: "Assessment",
    title: "Discover Your Ikigai",
    body: "Complete our comprehensive self-discovery assessment — what you love, what you are good at, what your community needs, and what creates opportunity for you. At the end, you receive a personalised Purpose Profile and a Purpose Statement written just for you.",
    tag: "Self-Discovery",
  },
  {
    num: "02",
    eyebrow: "AI Matching",
    title: "Meet Your Mentor",
    body: "Our algorithm matches you with the top five mentors based on shared interests, values, personality, and career alignment. Browse the mentor marketplace, choose yours, and begin a 3-day icebreaker phase before committing to the relationship.",
    tag: "Mentor Marketplace",
  },
  {
    num: "03",
    eyebrow: "Your Plan",
    title: "Choose Your Plan",
    body: "Select a mentor subscription, a one-time package, or apply for a sponsored scholarship — no one is left behind due to financial barriers. Payment unlocks full mentorship access, and your invoice history and reminders are all managed in the app.",
    tag: "Flexible Plans",
  },
  {
    num: "04",
    eyebrow: "Growth Roadmap",
    title: "Follow Your Roadmap",
    body: "Work through four structured phases — Find Yourself, Build Yourself, Discover Purpose, and Create Impact. Every milestone you complete — a session, journal entry, workshop, or assessment — grows your personal Growth Tree and contributes to your overall progress.",
    tag: "4 Phases",
  },
  {
    num: "05",
    eyebrow: "Community",
    title: "Create Impact",
    body: "Attend signature events like the Finding Yourself Picnic, complete three verified in-person mentor meetings, engage in community projects and advocacy, and graduate as a confident, purpose-driven leader ready to give back to Sierra Leone.",
    tag: "Graduate & Lead",
  },
] as const;

function StepItem({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "grid items-start gap-6 border-b border-border py-14 sm:grid-cols-[100px_1fr] sm:gap-12",
        isEven && "sm:grid-cols-[1fr_100px]",
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : `translateX(${isEven ? "56px" : "-56px"})`,
        transition:
          "opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Number — order swaps for even steps */}
      <div
        className={cn(
          "font-display text-7xl font-black leading-none transition-colors duration-500 sm:text-8xl",
          isEven && "sm:order-2 sm:text-right",
        )}
        style={{ color: visible ? "#1A5C3A" : "#E5E2DC" }}
      >
        {step.num}
      </div>

      {/* Text */}
      <div className={cn(isEven && "sm:order-1")}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-muted">
          {step.eyebrow}
        </p>
        <h3 className="font-display mb-4 text-3xl font-black leading-tight text-foreground sm:text-4xl">
          {step.title}
        </h3>
        <p className="mb-5 text-base leading-relaxed text-muted-foreground">
          {step.body}
        </p>
        <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-primary">
          {step.tag}
        </span>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Page header */}
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              The Platform
            </p>
            <h1 className="font-display mb-5 text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              How Ikigai Works
            </h1>
            <p className="text-xl leading-relaxed text-primary-muted">
              A structured, accountable journey from self-discovery to community
              impact.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-4xl px-6 pb-8">
          {STEPS.map((step, i) => (
            <StepItem key={step.num} step={step} index={i} />
          ))}
        </section>

        <InstallCta
          headline="Start your journey today."
          body="Join hundreds of young people across Sierra Leone who are already discovering their ikigai."
        />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify page loads**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/how-it-works
```
Expected: `200`

---

## Task 5: About Page

**Files:**
- Create: `app/(marketing)/about/page.tsx`

- [ ] **Step 1: Create `app/(marketing)/about/page.tsx`**

```tsx
import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { SectionReveal } from "@/components/marketing/section-reveal";

const WHO_WE_SERVE = [
  {
    title: "Mentees",
    body: "Youth seeking purpose, guidance, and personal growth. Complete the Ikigai assessment, follow your structured roadmap, connect with a verified mentor, and build the confidence to become who you are meant to be.",
    accent: "border-primary",
  },
  {
    title: "Mentors",
    body: "Experienced professionals and community leaders ready to guide the next generation. You are carefully verified, thoughtfully matched, and given the tools to make a measurable difference in a young person's life.",
    accent: "border-accent",
  },
  {
    title: "Schools & Clubs",
    body: "Student leaders and teachers setting up Ikigai clubs on campus. Bring structured mentorship, purpose discovery, and personal development to your entire school community.",
    accent: "border-earth",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Vision & Mission — full-bleed green header */}
        <section className="bg-primary pb-24 pt-40">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              About Ikigai Digital
            </p>
            <h1 className="font-display mb-8 text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Our Vision
            </h1>
            <blockquote className="mb-10 border-l-4 border-accent pl-6">
              <p className="font-display text-2xl font-bold leading-snug text-primary-foreground sm:text-3xl">
                "To build a generation of confident, emotionally healthy,
                purpose-driven, and socially responsible young people across
                Africa."
              </p>
            </blockquote>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-muted">
                  Our Mission
                </p>
                <p className="text-lg leading-relaxed text-primary-foreground/80">
                  To connect young people with the guidance, opportunities,
                  tools, and community they need to discover who they are and
                  become who they are meant to be.
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-muted">
                  Where We Are
                </p>
                <p className="text-lg leading-relaxed text-primary-foreground/80">
                  Ikigai Digital is based in Sierra Leone, building technology
                  for African youth. We serve youth, mentors, parents, schools,
                  and organisations across Freetown and Western Rural Area.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionReveal>
              <div className="mb-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  Who We Serve
                </p>
                <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
                  Three ways to join the movement.
                </h2>
              </div>
            </SectionReveal>
            <div className="grid gap-4 sm:grid-cols-3">
              {WHO_WE_SERVE.map((item, i) => (
                <SectionReveal key={item.title} delay={i * 0.1}>
                  <div
                    className={`rounded-r-2xl border-l-4 bg-card px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.accent}`}
                  >
                    <h3 className="font-display mb-3 text-xl font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* The Platform — prose section */}
        <section className="bg-secondary py-24">
          <SectionReveal>
            <div className="mx-auto max-w-3xl px-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                The Platform
              </p>
              <h2 className="font-display mb-6 text-4xl font-black text-foreground">
                Technology meets human connection.
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Ikigai Digital combines artificial intelligence, mentorship,
                  self-discovery, structured learning, wellness tools, and
                  community engagement into a single ecosystem designed for
                  African youth.
                </p>
                <p>
                  Unlike traditional mentorship programmes that rely on informal
                  relationships and manual matching, Ikigai creates a structured,
                  accountable, and scalable experience through AI-powered
                  matching, developmental roadmaps, activity participation, and
                  progress tracking.
                </p>
                <p>
                  Every interaction — a mentorship session, a journal entry, a
                  workshop, a community project — is tracked, visualised, and
                  celebrated. We believe that when young people can see their
                  growth, they keep growing.
                </p>
              </div>
            </div>
          </SectionReveal>
        </section>

        <InstallCta
          headline="Be part of the movement."
          body="Join hundreds of youth, mentors, and schools already building the next generation of African leaders."
        />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/about
```
Expected: `200`

---

## Task 6: Contact Page

**Files:**
- Create: `app/(marketing)/contact/page.tsx`
- Create: `app/(marketing)/contact/contact-form.tsx`

- [ ] **Step 1: Create `app/(marketing)/contact/contact-form.tsx`**

```tsx
"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:hello@ikigai.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            type="text"
            required
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Subject
        </label>
        <input
          type="text"
          required
          placeholder="What is this about?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          required
          rows={5}
          placeholder="Your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Send Message
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `app/(marketing)/contact/page.tsx`**

```tsx
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Get in Touch
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Contact Us
            </h1>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-10">
              <p className="text-base leading-relaxed text-muted-foreground">
                Have a question, partnership enquiry, or want to bring Ikigai to
                your school? We would love to hear from you.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Or email us directly at{" "}
                <a
                  href="mailto:hello@ikigai.app"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  hello@ikigai.app
                </a>
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/contact
```
Expected: `200`

---

## Task 7: Legal Pages — Privacy and Terms

**Files:**
- Create: `app/(marketing)/privacy/page.tsx`
- Create: `app/(marketing)/terms/page.tsx`

- [ ] **Step 1: Create `app/(marketing)/privacy/page.tsx`**

```tsx
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Legal
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-primary-muted">
              Last updated: June 2026
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6 prose prose-sm sm:prose-base max-w-none">
            <div className="space-y-10 text-muted-foreground">

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">What We Collect</h2>
                <p className="leading-relaxed">We collect information you provide when creating an account, completing the Ikigai assessment, communicating with mentors, or contacting us. This includes your name, email address, date of birth, location, and responses to the purpose and personality assessments. We also collect usage data such as pages visited, features used, and session duration to improve the platform.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">How We Use It</h2>
                <p className="leading-relaxed">We use your information to provide and improve the Ikigai platform, match you with suitable mentors, track your progress through the developmental roadmap, send you relevant notifications and updates, ensure the safety of all users through content moderation, and comply with our legal obligations. We do not sell your personal data to third parties.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Data Storage</h2>
                <p className="leading-relaxed">Your data is stored securely using industry-standard encryption. We use trusted cloud infrastructure providers. Journal entries and personal assessments are stored in encrypted databases and are accessible only to you and, where you choose to share them, your assigned mentor. We retain your data for as long as your account is active or as required by law.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Your Rights</h2>
                <p className="leading-relaxed">You have the right to access, correct, or delete your personal data at any time by contacting us or through your account settings. You may withdraw consent for non-essential data processing at any time. If you are under 18, a parent or guardian may exercise these rights on your behalf. To request data deletion or export, contact us at the address below.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Contact</h2>
                <p className="leading-relaxed">For privacy-related questions or requests, contact us at <a href="mailto:hello@ikigai.app" className="text-primary underline-offset-2 hover:underline">hello@ikigai.app</a>. We will respond within 30 days.</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(marketing)/terms/page.tsx`**

```tsx
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Legal
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-primary-muted">
              Last updated: June 2026
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="space-y-10 text-muted-foreground">

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Acceptance</h2>
                <p className="leading-relaxed">By installing or using the Ikigai platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the platform. These terms apply to all users including mentees, mentors, parents, and school administrators.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Use of Service</h2>
                <p className="leading-relaxed">Ikigai is a mentorship and personal development platform designed for youth in Sierra Leone. You may use the platform only for its intended purpose — personal growth, mentorship, and community engagement. You must be at least 13 years old to create an account. Users under 18 require parental or guardian consent.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">User Conduct</h2>
                <p className="leading-relaxed">You agree not to harass, bully, or abuse other users. You agree not to share inappropriate, offensive, or harmful content. You agree not to impersonate other individuals or misrepresent your credentials as a mentor. Violations may result in immediate suspension or permanent removal from the platform. All reported content is reviewed by our administration team.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Accounts</h2>
                <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorised use of your account. Mentor accounts are subject to verification before access to mentorship features is granted.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Limitation of Liability</h2>
                <p className="leading-relaxed">Ikigai Digital provides the platform on an "as is" basis. We do not guarantee that the service will be uninterrupted or error-free. To the maximum extent permitted by law, Ikigai Digital shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Governing Law</h2>
                <p className="leading-relaxed">These terms are governed by the laws of Sierra Leone. Any disputes arising from the use of Ikigai shall be subject to the jurisdiction of the courts of Sierra Leone. For questions about these terms, contact us at <a href="mailto:hello@ikigai.app" className="text-primary underline-offset-2 hover:underline">hello@ikigai.app</a>.</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify both pages**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/privacy && echo " privacy" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/terms && echo " terms"
```
Expected: `200 privacy` and `200 terms`

- [ ] **Step 4: Run type check across the whole project**

```bash
cd /home/walon/Code/ikigai && bunx tsc --noEmit 2>&1 | grep -v ".next/dev/types" | head -20
```
Expected: zero errors.

- [ ] **Step 5: Run linter**

```bash
bunx biome check 2>&1 | tail -3
```
Expected: `No fixes applied.`
