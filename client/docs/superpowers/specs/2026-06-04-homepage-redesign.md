# Marketing Homepage Redesign — Design Spec

**Date:** 2026-06-04
**Status:** Approved
**Surface:** `ikigai.app` — `app/(marketing)/page.tsx` + `app/(marketing)/hero.tsx`

---

## Goal

Upgrade the marketing homepage from bland to distinctive. Remove the "For Youth · Sierra Leone" pill badge, strengthen the hero with a light editorial aesthetic, and replace all flat cards with numbered glow-fill cards. The GrowthTree animation in the hero is a signature element — keep and enhance it.

---

## Design Direction

**Light Editorial + Glow Fill.** White hero background, large `IK` watermark, yellow underline on key phrase, square buttons. Cards use pastel tinted backgrounds with a radial colour glow that blooms from the bottom-left corner on hover.

---

## Hero Section (`app/(marketing)/hero.tsx`)

### Layout
Two-column on desktop (text left, GrowthTree panel right). Single column on mobile (tree panel hidden).

### Changes from current
- **Remove** the `"For Youth · Sierra Leone"` pill badge (`<motion.div className="mb-6 inline-block rounded-full bg-primary-muted/20 ...">`)
- **Replace** with eyebrow line: yellow dot (`w-2 h-2 rounded-full bg-accent`) + small uppercase text `"Sierra Leone · Youth Platform"`
- **Background** changes from `bg-primary` (dark green) to `bg-background` (off-white `#FAFAF7`)
- **Watermark** `IK` text — large, absolute-positioned, `text-[180px] font-black text-border/60`, right side, vertically centred, `pointer-events-none z-0`
- **Headline** `h1` colour changes from `text-primary-foreground` to `text-foreground`. Key phrase `"purpose-driven"` is wrapped in a `<span className="relative inline">` containing a sibling `<span aria-hidden className="absolute inset-x-0 bottom-1 h-[10px] bg-accent/30 -z-10 rounded-sm">` to produce the yellow highlight underlay (no pseudo-elements needed, works with Tailwind v4)
- **Body text** colour from `text-primary-muted` to `text-muted-foreground`
- **Buttons** change from `rounded-full` to `rounded-lg` (square-ish). Primary becomes `bg-primary text-primary-foreground`. Ghost keeps outline but uses `border-border text-foreground`
- **Floating blobs** removed (no longer fits light background)
- **framer-motion entrance animations** kept on text elements (opacity/y)

### GrowthTree Panel
- White card, `border border-border rounded-2xl p-6 shadow-sm`
- Subtle radial glow at base: `absolute inset-0 bg-radial-gradient from-primary/5 to-transparent`
- Tree stats row below the tree (`Milestones` count + `Level`)
- The `<GrowthTree>` component keeps its existing animation — no changes to that component

---

## Problem Section (`app/(marketing)/page.tsx` → `ProblemSection`)

### Card redesign — Numbered Glow Fill cards
Replace the current `rounded-r-2xl border-l-4` pattern with the new glow card pattern for all three cards.

**Structure per card:**
```tsx
<div className="glow-card glow-green"> {/* or amber / earth */}
  <p className="glow-card-num">01 — Mentorship</p>
  <h3>No trusted mentors</h3>
  <p>...</p>
</div>
```

**CSS behaviour (via Tailwind):**
- Background: tinted pastel (`bg-green-50` / `bg-amber-50` / `bg-orange-50` — map to design tokens)
- Border: `border border-primary/10` (or accent/earth variant)
- On hover: `translateY(-4px)` + radial glow from bottom-left corner (`:hover::before` with `opacity-100`) + inset border glow via `ring`
- Numbered label: `text-[10px] font-extrabold tracking-widest uppercase` in accent colour

**Colour mapping:**
| Card | Background (inline style) | Glow (inline radial) | Label colour |
|------|-----------|-------------|--------------|
| No trusted mentors | `oklch(0.96 0.02 154)` (green tint) | `rgba(26,92,58,…)` | `text-primary` |
| Limited guidance | `oklch(0.97 0.03 75)` (amber tint) | `rgba(245,166,35,…)` | `text-accent` |
| Declining engagement | `oklch(0.96 0.025 35)` (terracotta tint) | `rgba(192,92,58,…)` — maps to `--earth` | `text-earth` |

---

## Platform Section (`app/(marketing)/page.tsx` → `PlatformSection`)

Same glow card treatment as Problem section. Four cards in a 2×2 grid.

**Colour mapping:**
| Card | Background (inline style) | Glow | Label |
|------|-----------|------|-------|
| AI Mentor Matching | `oklch(0.96 0.02 154)` | green → `--primary` | `text-primary` |
| Purpose Discovery | `oklch(0.97 0.03 75)` | amber → `--accent` | `text-accent` |
| Growth Roadmap | `oklch(0.96 0.025 35)` | terracotta → `--earth` | `text-earth` |
| Flexible Plans | `oklch(0.96 0.02 155)` | sage → `--primary-light` | `text-primary-light` |

Grid: `sm:grid-cols-2` (2 columns on all non-mobile). Cards stretch to equal height (`h-full flex flex-col`).

---

## Stats Bar (`StatsBar`)

No layout change. Update copy from `"500+ Youth registered"` / etc. to `"Year 1 Goals"` framing already in current code. Keep `bg-primary` (dark green) — provides strong visual contrast break between the light card sections and the dark CTA.

---

## Scroll Animations

- Existing `SectionReveal` component stays — wraps each card with stagger delay (`delay={i * 0.08}`)
- Glow card hover effect is CSS-only (no JS needed)
- Hero text entrance uses existing framer-motion `initial/animate` pattern

---

## Reusable Glow Card

Extract the glow card as a shared component at `components/marketing/glow-card.tsx` to avoid repeating the hover logic across ProblemSection and PlatformSection.

**Props:**
```ts
interface GlowCardProps {
  num: string        // e.g. "01 — Mentorship"
  title: string
  body: string
  variant: "green" | "amber" | "earth" | "sage"
  className?: string
}
```

The component renders the pastel background and hover effects. Because Tailwind v4 utility classes can't target `::before` with dynamic radial gradients, the glow overlay is implemented as a sibling `<span aria-hidden>` with `absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity` and a `style={{ background: 'radial-gradient(...)' }}` inline prop. The card div carries `group relative overflow-hidden`. Hover lift is `transition-transform hover:-translate-y-1`. Inset ring on hover: `hover:ring-2 hover:ring-[color]/30`.

---

## Files Changed

| Action | File | Change |
|--------|------|--------|
| Modify | `app/(marketing)/hero.tsx` | Full redesign per spec above |
| Modify | `app/(marketing)/page.tsx` | Replace card markup in ProblemSection + PlatformSection |
| Create | `components/marketing/glow-card.tsx` | New reusable glow card component |

`components/marketing/footer.tsx`, `nav.tsx`, `section-reveal.tsx`, `install-cta.tsx` — **no changes**.

---

## Out of Scope

- Other marketing pages (how-it-works, about, contact, pricing, privacy, terms)
- PWA or admin surfaces
- Any changes to the `GrowthTree` component itself
- Dark mode
