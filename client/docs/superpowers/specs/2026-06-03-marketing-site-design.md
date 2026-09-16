# Marketing Site — ikigai.app Design Spec

**Date:** 2026-06-03
**Status:** Approved
**Surface:** `ikigai.app` — `app/(marketing)/` route group

---

## Goal

Replace the current marketing home page (which has auth links and a generic AI aesthetic) with a professional, purpose-driven company site. Add five new pages. The site's single job is to get visitors to install the PWA — there is no auth on this surface.

---

## Design Decisions

| Decision | Choice |
|---|---|
| Direction | Premium Minimal — centred, spacious, confident |
| Homepage layout | Mission-first — hero opens with vision, then problem, then platform |
| Card style | Left-accent bordered — coloured left border, no icons, text only |
| How It Works animation | Alternating left/right scroll reveal, spring easing, number colour transition |
| Emoji | None — zero emoji anywhere |
| Auth links | None — no sign-in, sign-up, or Clerk references |
| Primary CTA | "Install the App" → `https://app.ikigai.app` (or `APP_HOSTNAME` env var) |

---

## Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Home |
| `/how-it-works` | `app/(marketing)/how-it-works/page.tsx` | 5-step platform explainer |
| `/about` | `app/(marketing)/about/page.tsx` | Vision, mission, who we serve |
| `/contact` | `app/(marketing)/contact/page.tsx` | Contact form |
| `/privacy` | `app/(marketing)/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/(marketing)/terms/page.tsx` | Terms of service |

---

## Shared Components (`components/marketing/`)

### `nav.tsx`
Sticky navbar. Transparent over hero sections, white + border on scroll.

**Left:** Ikigai wordmark (Fraunces serif, bold) + "Digital" subtitle in `primary-muted`.
**Centre (desktop):** How It Works · About · Contact
**Right:** "Install the App" pill button → `https://${NEXT_PUBLIC_APP_HOSTNAME}/` (defaults to `app.ikigai.app`). Nav is a client component (scroll transparency effect requires `useEffect`).

Mobile: hamburger menu, full-screen drawer with same links.

### `footer.tsx`
Three columns on desktop, stacked on mobile.

- **Col 1:** Logo + "Empowering youth to discover purpose, build confidence, and prioritise mental wellness. Built for Sierra Leone."
- **Col 2:** Platform — How It Works · About · Contact
- **Col 3:** Legal — Privacy Policy · Terms of Service

Bottom bar: © {year} Ikigai Digital

### `section-reveal.tsx`
`"use client"` wrapper. Uses `IntersectionObserver`. Children fade up 24px on enter.

```tsx
// Usage
<SectionReveal delay={0.1}>
  <SomeSection />
</SectionReveal>
```

Props: `delay?: number` (seconds, default 0), `className?: string`

Animation: `opacity: 0 → 1`, `translateY: 24px → 0`, duration 0.65s, easing `cubic-bezier(0.16, 1, 0.3, 1)`. Triggers once — no re-trigger on scroll up.

### `install-cta.tsx`
Reusable dark CTA block used at the bottom of every page.

Background: `#1C1C1A`. Fraunces headline + body copy + golden "Install the App — Free" pill button.
Headline and body copy are props so each page can customise the message.

---

## Homepage (`/`)

### Navbar
Standard `<Nav />` component.

### Hero
Full-bleed `bg-primary` (`#1A5C3A`). Text `text-primary-foreground`.

- Small eyebrow: "For Youth · Sierra Leone" — uppercase, letter-spaced, `primary-muted` colour
- H1 (Fraunces, 900): The vision quote from PRD — *"To build a generation of confident, emotionally healthy, purpose-driven young people across Africa."* Split across 2–3 lines, large.
- Subtext: One sentence describing the platform
- Two CTAs: Primary — "Install the App" golden pill. Secondary — "How It Works →" ghost pill (white border, white text)

### Problem Section
Background: `#F0EDE8` (muted/secondary). `<SectionReveal>` wrapped.

Eyebrow: "The Challenge"
Headline: "Young people face real barriers."

Three left-accent bordered cards, green accent:
1. **No trusted mentors** — matching is random, progress untracked
2. **Limited guidance** — career direction, purpose, accountability all missing
3. **Declining engagement** — without structure, mentorship relationships fade

### Platform Section
Background: white. `<SectionReveal>` wrapped.

Eyebrow: "Our Platform"
Headline: "Everything in one place."

Four left-accent bordered cards, colour-coded:
1. `border-primary` — **AI Mentor Matching** — top 5 by interests, values, personality, goals
2. `border-accent` — **Purpose Discovery** — Ikigai assessment generates a personal Purpose Profile
3. `border-earth` — **Growth Roadmap** — 4 structured phases, visualised as a Growth Tree
4. `border-primary-light` — **Flexible Plans** — subscriptions, one-time packages, and sponsored scholarships — no one gets left behind

### Stats Bar
Full-width `bg-primary`. Three stats in a row:

- 500+ Youth registered
- 200+ Verified mentors
- 20+ School clubs

### Install CTA
`<InstallCta>` component.
Headline: "Ready to start your journey?"
Body: "Young people across Sierra Leone are discovering their ikigai. Your story starts here."

### Footer
`<Footer />` component.

---

## How It Works (`/how-it-works`)

### Structure
Navbar + page header (centred) + 5 scroll-reveal steps + InstallCta + Footer.

**Page header:**
- Eyebrow: "The Platform"
- H1: "How Ikigai Works"
- Subtitle: "A structured, accountable journey from self-discovery to community impact."

### 5-Step Scroll Reveal

Each step is a full-width row. Odd steps: number left, text right. Even steps: text left, number right. Separated by a `border-b border-border`.

**Animation (per step):**
- Initial: `opacity: 0`, `translateX: ±56px` (left for odd, right for even)
- On enter viewport (`threshold: 0.15`): `opacity: 1`, `translateX: 0`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`, duration 0.75s
- Number colour: starts `#E5E2DC`, transitions to `#1A5C3A` on enter, duration 0.5s ease
- `IntersectionObserver` fires once — no reset

**The 5 steps:**

| # | Eyebrow | Title | Content summary |
|---|---|---|---|
| 01 | Assessment | Discover Your Ikigai | Complete the Ikigai framework assessment — what you love, strengths, community needs, opportunities. Receive a Purpose Profile and personalised Purpose Statement. |
| 02 | AI Matching | Meet Your Mentor | Algorithm matches top 5 mentors by interests, values, personality, career alignment. Browse the marketplace, choose yours, start a 3-day icebreaker before committing. |
| 03 | Your Plan | Choose Your Plan | Mentor subscriptions, one-time packages, or sponsored scholarships. Payment unlocks mentorship access. Invoice history and automated reminders included. |
| 04 | Growth Roadmap | Follow Your Roadmap | Work through 4 phases: Find Yourself → Build Yourself → Discover Purpose → Create Impact. Every milestone — session, journal entry, workshop — grows your digital Growth Tree. |
| 05 | Community | Create Impact | Attend the Finding Yourself Picnic, complete 3 verified in-person mentor meetings, contribute to community projects, and graduate as a purpose-driven leader. |

Each step also has a small tag pill (e.g. "Self-Discovery", "Mentor Marketplace", "Flexible Plans", "4 Phases", "Graduate & Lead") shown below the body text.

### Bottom
`<InstallCta>` with headline: "Start your journey today."

---

## About (`/about`)

Three `<SectionReveal>`-wrapped sections + InstallCta + Footer.

### Vision & Mission
Full-bleed `bg-primary` header section (same treatment as homepage hero but shorter).
- Vision: "To build a generation of confident, emotionally healthy, purpose-driven and socially responsible young people across Africa."
- Mission: "To connect young people with the guidance, opportunities, tools, and community they need to discover who they are and become who they are meant to be."

### Who We Serve
Three left-accent bordered cards on white background:

1. `border-primary` — **Mentees** — Youth seeking purpose, guidance, and growth. Complete the assessment, follow your roadmap, connect with a mentor.
2. `border-accent` — **Mentors** — Experienced professionals and community leaders ready to guide the next generation. Verified, matched carefully, making real impact.
3. `border-earth` — **Schools & Clubs** — Student leaders setting up Ikigai clubs on campus. Bring mentorship and purpose to your entire school community.

### The Platform
Text section. Brief description of Ikigai Digital as an organisation — based in Sierra Leone, building tech for African youth, combining AI with human connection.

---

## Contact (`/contact`)

Simple form. No auth. On submit, opens `mailto:hello@ikigai.app` with subject and body pre-filled from form values. A proper server action can replace this later without changing the UI.

Fields:
- Name (text input, required)
- Email (email input, required)
- Subject (text input, required)
- Message (textarea, required, 5 rows)
- Submit button: "Send Message" — `bg-primary` pill

Below form: `hello@ikigai.app` shown as a plain text link.

---

## Legal Pages (`/privacy`, `/terms`)

Minimal design — same navbar and footer. Content in a max-width prose column.

**Privacy:** Sections — What we collect · How we use it · Data storage · Your rights · Contact
**Terms:** Sections — Acceptance · Use of service · User conduct · Accounts · Limitation of liability · Governing law

Content is placeholder prose structured into these sections. Real legal copy to be added before launch.

---

## Animation System

### `section-reveal.tsx` (global)
- fade up 24px, duration 0.65s, `cubic-bezier(0.16, 1, 0.3, 1)`
- fires once on enter
- `delay` prop for staggering sibling sections

### How It Works scroll reveal (local to page)
- left/right slide 56px + fade, duration 0.75s, spring easing
- number colour `#E5E2DC → #1A5C3A`, duration 0.5s
- fires once per step

### Hover states (all interactive cards)
- `transition: box-shadow 200ms ease, transform 200ms ease`
- on hover: `shadow-md` + `translateY(-2px)`

### Nav Install button
- `transition: transform 150ms ease`
- on hover: `scale(1.03)`

---

## What Does Not Change

- `app/(marketing)/layout.tsx` — stays as-is (plain passthrough, no Clerk)
- Color tokens in `globals.css` — unchanged
- Font setup in root layout — unchanged
- Middleware — no changes needed (marketing domain already enforced)
- Any PWA, admin, or app routes — untouched
