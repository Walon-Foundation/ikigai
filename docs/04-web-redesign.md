# 04 — Marketing + admin redesign

**Status:** planning. **Depends on:** nothing. **Blocks:** nothing.

The only track that touches no architecture. It can run alongside all of
[01](./01-api-server.md), [02](./02-auth.md) and [03](./03-mobile.md), and it
is the only one that produces something visible early.

---

## Scope

| Surface | Files | Notes |
|---|---|---|
| `client/app/(marketing)/` | 29 | Public, SEO-indexed, CMS-driven |
| `client/app/admin/` | 106 | Staff panel on `admin.*` |

Admin is three and a half times the size of marketing. Any plan that treats
"redesign the remaining UI" as one job will spend all of its time in admin and
none of it on the site the public actually sees.

**`app/(pwa)/` is out of scope here** — it is being rebuilt in
[mobile](./03-mobile.md), and the web PWA keeps its current design.

---

## The actual problem is not aesthetics

`ROADMAP.md` already names it: `components/ui/` contains exactly **two**
components — `button.tsx` and `card.tsx` — while the rest of the codebase
open-codes `rounded-2xl border bg-card p-5` in place. The design tokens in
`app/globals.css` are good and consistent; what is missing is anything
enforcing them.

So a visual redesign applied on top of 135 files of drift would have to be
applied 135 times, and would drift again.

**Do the system first.** Once a table, a form field, an empty state and a page
header each exist once, the visual pass is a change to those definitions rather
than a change to every page. That inverts the cost of the whole track.

### What exists to build on

- **Tokens** — oklch in `app/globals.css`: forest green `--primary #1A5C3A`,
  golden `--accent #F5A623`, terracotta `--earth #C05C3A`. Dark mode switches on
  `.dark` plus `color-scheme`, and works on all three surfaces today.
- **Type** — Fraunces 900 for display, DM Sans for body, JetBrains Mono for
  codes only. Self-hosted through `next/font`; there is no Google connection,
  which the CSP depends on.
- **Motion** — CSS `fade-up` on the marketing hero, framer-motion reserved for
  the growth tree. `prefers-reduced-motion` is respected.
- **Lite Mode** — `data-lite` with `liteHidden`, an existing, working
  low-bandwidth affordance. It is a product feature, not a debug flag.

---

## Order

### 1. The component layer
Before any visual change. Extract from what is already repeated:

- `Button`, `Card` — exist; adopt them everywhere and delete the open-coded copies
- `Table` — admin has a dozen hand-rolled tables with divergent density and no keyboard affordances
- `Field` / `FormRow` — including the inline error shape that server actions
  already return, so validation rendering stops being per-page
- `EmptyState` — the `border-dashed` pattern, currently retyped
- `PageHeader` — exists as `components/page-header.tsx`; make it consistent
- One radius and spacing scale. `rounded-xl` and `rounded-2xl` are currently mixed

This step should change how the app looks very little and how it is built a lot.

### 2. Marketing
Smaller, public, and the higher-leverage half.

19 routes including the block-driven home page, programmes, stories, events,
gallery, partners, team, and CMS-authored custom pages via `[slug]`.

Constraints that are not negotiable here:

- **Low-bandwidth first.** No heavy JS on the hero. Images stay at `quality={60}`
  through `next/image`. The audience is on metered mobile data in Freetown and
  the Western Rural Area, and a 4MB campaign photo is a real cost to the person
  looking at it.
- **No fabricated content.** `stories`, `gallery_items`, `partners` and
  `team_members` are **empty** in the live database. `impact_stats` has four
  real rows and is safe to feature. A redesign must look right with empty
  sections — designing against imagined testimonials and partner logos produces
  a site that looks broken on the day it ships.
- **Edits appear instantly.** Marketing reads are `force-dynamic` deliberately.
  Do not introduce caching to make a redesign feel faster.

### 3. Admin
The bulk. Once the component layer exists, most of this is adoption rather than
design.

Priorities, in order of how much time staff actually spend there:

1. **Dashboard and analytics** — the landing surface
2. **Queues** — mentor verification, school vetting, safeguarding, enquiries.
   These are the screens where a mistake has consequences. Decision actions
   should be unmistakable, and rejection reasons are mandatory before the
   destructive action is enabled (already true for mentors — make it uniform)
3. **CMS** — 11 sections sharing one `resource-manager.tsx` pattern. Improve the
   shared component, not the eleven pages
4. **Everything else** — users, clubs, guardians, events, skills, notifications

Table density and keyboard navigation are the two changes staff will feel most,
per `ROADMAP.md`.

---

## The one scheduling collision

**Do not redesign an admin screen while its endpoints are being moved.**

[01](./01-api-server.md) recommends admin's 63 server actions stay where they
are, which mostly removes this risk. If that recommendation is overturned,
sequence each admin area either well before or well after its port — never
concurrently. Two branches rewriting the same 106 files in different directions
is the one avoidable disaster in this plan.

---

## Accessibility

`ROADMAP.md` targets WCAG 2.1 AA and a Lighthouse score above 90 on 3G, but
`PRODUCT.md` records that no accessibility standard has actually been confirmed.

**Confirm the target before the redesign, not after.** Retrofitting contrast
ratios, focus order and touch target sizes into a finished design costs several
times what building to them costs. Low-bandwidth optimisation is already a
confirmed constraint; accessibility should be too, and the redesign is the
cheapest moment to commit.

---

## Open questions

- **Is there a visual identity to work from?** `PRODUCT.md` records none — only
  PWA icon PNGs and the two source images in `client/docs/brand/`. No logo SVG,
  no brand guide. A redesign without one is the design team inventing it, which
  is fine, but should be a decision rather than a surprise
- **Is the marketing site's information architecture staying?** 19 routes is a
  lot for an organisation this size, and a redesign is the moment to consolidate
- **Does the admin panel keep its own visual language**, or share the marketing
  system? Staff tools and public sites usually want different densities
- **WCAG 2.1 AA — confirmed or not?**
