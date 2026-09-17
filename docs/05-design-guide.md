# 05 — Web design guide: marketing + admin

**Status:** proposed. **Written:** 17 September 2026. **Serves:** [04-web-redesign.md](./04-web-redesign.md).

The visual system for the redesign of `client/app/(marketing)/` and
`client/app/admin/`. It blends six reference designs (kept locally in `/images`, which is gitignored) into one
system built on Ikigai's own brand, so that the public site, the staff panel
and the mobile app read as one product. A visual preview is at
https://claude.ai/artifact/6gfh6Xd5Vt7pgMVXT5NDf4 and a clickable prototype at
https://claude.ai/artifact/EAKJs1CpcDAXQYhbCt9jPP (the prototype is newer where
they differ).

The PWA is being dropped, so these two surfaces are the whole of the web.
Nothing here needs to stay compatible with `app/(pwa)/`.

---

## What we took from each reference

Each reference is good at one or two things and wrong for Ikigai in others.
This table is the blend. When a page is ambiguous, go back to the reference
named here for the detail, and nothing else from it.

| Reference | Take | Leave |
|---|---|---|
| **landing-page** (Peepalfarm) | Barely tinted page ground. Serif headline in deep green. Headline left, one strong visual right. | The playful parts: pill buttons, photo collage, silhouettes, the "watch our story" badge. Tried in the first prototype and read as childish for an organisation working on safeguarding. |
| **admin-dashboard** (ProfitPulse) | Dark sidebar with a light active pill. Warm off-white canvas. Soft pastel status chips. Selected row lifts to white. **Right-side detail drawer** that opens a record without leaving the list, with a paired action footer. | Near-black. Ours is deep forest green. Photo avatars everywhere. |
| **admin-dashboard2** (Confidency OS) | **Grouped sidebar** with small section labels. Search with a `⌘K` hint. **KPI tiles** that give a number, a delta *and* its context ("vs last week"). Filter chips above the table. Name + email as a two-line cell. Secondary + primary header actions. "Showing 1–10 of 80" pagination footer. | Purple. |
| **admin-ui2** (travel dashboard) | **Pipeline stages** as chevron headers with cards under each. Inline score bars inside table cells. Status as dot + word. Daily / monthly / yearly segmented toggle on charts. | Photo background. Wine-and-rust palette. Density for its own sake. The AI panel. |
| **cms-ui** (Untitled UI) | Breadcrumbs over a title and its meta line. **Save as draft / Publish** as the header pair. Formatting toolbar above rich text. A context card beside the editor. User card pinned to the bottom of the sidebar. Count badges on nav items. | macOS window chrome. |
| **cms2** (orange CMS) | **Three-pane editor**: outline of fields on the left, content in the middle, publishing panel on the right. An icon for each field type. A **sticky bottom bar** with Discard and Save. Per-item publish state. | Saturated orange ground. Environments (we have draft / published only). |

**Short version:** a marketing site with Peepalfarm's layout but an
editorial, grown-up finish. An admin that has ProfitPulse's shell and drawer, Confidency's
navigation and stats, and one CMS editor built from the two CMS references.

---

## Principles

1. **One brand, three surfaces.** The web uses the same logo-sampled palette
   as the mobile app (`mobile/src/theme/brand.ts`). A mentor who sees the app
   and then the admin should recognise both.
2. **Two densities, one system.** Marketing is roomy and editorial; admin is
   compact and operational. They share tokens, type families and components;
   they differ in spacing, type size and radius, never in colour or identity.
3. **Bandwidth is a design material.** The audience is on metered data in
   Freetown and the Western Rural Area. No background photographs, no
   decorative video, no image that is not content. Every image is lazy,
   `next/image`, `quality={60}`.
4. **Design the empty state first.** `stories`, `gallery_items`, `partners`
   and `team_members` are empty in production. A section with no rows
   disappears or shows a designed empty state. It never shows placeholder
   people, fake quotes or stock logos.
5. **Decisions about children are unmistakable.** On the safeguarding,
   verification and vetting queues, the approve and reject actions are
   separated, labelled with what they do, and rejection needs a reason before
   it enables.
6. **Colour is never the only signal.** Every status has a word. Every chart
   series has a label.

---

## Colour

The web palette is replaced by the logo palette the mobile app already uses.
`--accent #F5A623` (gold) becomes `sun`, and `--earth #C05C3A` (terracotta)
becomes `orange`. Keep the existing token *names* in `globals.css` where they
map cleanly, so component code changes less than the values do.

### Brand

| Token | Hex | Use |
|---|---|---|
| `green` | `#1A5C3A` | Primary actions, links, active states. White text on it: 7.97:1 |
| `green-deep` | `#123F28` | Admin sidebar, marketing headlines, footer ground |
| `leaf` | `#469E4C` | Success marks, positive deltas, chart series. **Not** a text or button fill (3.36:1) |
| `leaf-soft` | `#E3F1E1` | Success chip ground, marketing section tint |
| `teal` | `#156F81` | Information, "in review", secondary chart series. Text-safe (5.8:1) |
| `teal-soft` | `#DDEFF1` | Info chip ground |
| `orange` | `#E66D21` | Illustration and chart fill only. **Not text** (3.19:1) |
| `orange-ink` | `#9C470C` | Orange as text, on white (6.3:1) or on `orange-soft` (5.3:1) |
| `orange-soft` | `#FCE8D8` | Warning / attention chip ground |
| `sun` | `#FAC613` | Highlights, the "pending" dot, marketing accents. **Never text** (1.6:1); `green-deep` on it is 7.4:1 |
| `sun-ink` | `#7A5800` | Pending chip text on `sun-soft` (5.9:1) |
| `sun-soft` | `#FEF4CC` | Pending chip ground |

### Neutrals

Warm, with a slight green bias, never pure grey.

| Token | Hex | Use |
|---|---|---|
| `ground-site` | `#F8F9F5` | Marketing page background, a barely-there green |
| `ground-admin` | `#F6F5F0` | Admin canvas (the ProfitPulse warm off-white) |
| `surface` | `#FFFFFF` | Cards, tables, drawers, inputs |
| `ink` | `#1C1F1B` | Body text (15.3:1 on `ground-admin`) |
| `ink-muted` | `#5C6159` | Secondary text, table meta (5.8:1 on `ground-admin`) |
| `ink-faint` | `#8A9187` | Placeholders and disabled only (3.2:1, not for content) |
| `line` | `#E4E6DF` | Borders, table rules |
| `line-strong` | `#CDD1C8` | Input borders, dividers that must be seen |
| `sidebar-ink` | `#A9C4B2` | Inactive nav text on `green-deep` (6.35:1) |

### Status

A status chip is a soft ground, an ink word and, in tables, a leading dot in
the strong colour. The word is always present.

| Meaning | Ground | Text | Dot | Ikigai statuses |
|---|---|---|---|---|
| Pending | `sun-soft` | `sun-ink` | `sun` | Applied, awaiting documents, new enquiry, draft |
| In review | `teal-soft` | `teal` | `teal` | Under review, interview booked, investigating |
| Approved | `leaf-soft` | `#2F6B33` | `leaf` | Verified, vetted, published, resolved |
| Attention | `orange-soft` | `orange-ink` | `orange` | Expiring, missing consent, overdue |
| Rejected / critical | `#FBE4E1` | `#A5281B` | `#C8321F` | Rejected, suspended, safeguarding high |
| Neutral | `#EEEFEA` | `ink-muted` | `ink-faint` | Archived, closed, withdrawn |

`danger` for destructive buttons: `#C8321F`, white text 5.3:1.

### Charts

Series in this order: `green`, `orange`, `teal`, `sun`, `leaf`. Gridlines
`line`, axis labels `ink-muted`. Area fills are the series colour at 12%.

### Dark mode

Marketing is **light only**, like the mobile app. Admin keeps a dark theme,
because staff work in it for long sessions and the current panel already
supports one. Dark admin inverts the neutrals only: the sidebar stays
`green-deep`, and the canvas goes to `#0F1A14`, matching today's dark
`--background`. Brand colours hold their roles, and the `*-ink` tokens switch
to their `*` counterparts. This is a proposal; see open questions.

---

## Typography

The families stay as they are, self-hosted through `next/font` (the CSP
depends on that):

| Role | Family | Where |
|---|---|---|
| Display | **Fraunces** | Marketing headlines; admin page titles and KPI numbers |
| UI and body | **DM Sans** | Everything else |
| Codes | **JetBrains Mono** | Invite codes, reference IDs, never prose |

Fraunces is what makes the Peepalfarm headline work, and Ikigai already owns
it. Use it at weight 600 for headlines, not the current 900, which reads as
heavy at the larger sizes below. Admin uses it sparingly: the page title and
the number in a KPI tile, so that the staff panel is recognisably Ikigai
without being editorial.

### Scale

| Token | Marketing | Admin |
|---|---|---|
| `display` | Fraunces 600, `clamp(2.5rem, 5vw, 4rem)` / 1.05 | — |
| `h1` | Fraunces 600, 2.5rem / 1.1 | Fraunces 600, 1.75rem / 1.2 (page title) |
| `h2` | Fraunces 600, 2rem / 1.15 | DM Sans 600, 1.125rem / 1.3 (card title) |
| `h3` | DM Sans 600, 1.25rem / 1.3 | DM Sans 600, 0.9375rem / 1.4 |
| `body` | DM Sans 400, 1.0625rem / 1.65 | DM Sans 400, 0.875rem / 1.5 |
| `small` | DM Sans 400, 0.875rem / 1.5 | DM Sans 400, 0.8125rem / 1.45 |
| `label` | DM Sans 600, 0.75rem, +0.06em, uppercase | same (sidebar group labels, table headers) |
| `stat` | Fraunces 600, 3rem | Fraunces 600, 2rem, tabular |

Headings get `text-wrap: balance`. Running text caps at `65ch`. All numbers in
tables, tiles and charts use `font-variant-numeric: tabular-nums`.

---

## Space, radius, elevation

**Spacing:** a 4px base: `4 8 12 16 20 24 32 40 56 80 120`. Marketing sections
are separated by `80` (mobile `56`); admin cards by `16`, with `24` padding
inside the canvas.

**Radius**, by role, not one radius everywhere:

| Radius | Use |
|---|---|
| `full` | Status chips, filter chips, count badges, avatars. **Not buttons** |
| `8px` | Admin buttons, inputs, selects, segmented controls |
| `10px` | Marketing buttons |
| `12px` | Admin cards, tables, KPI tiles |
| `16px` | Drawers, dialogs, marketing feature panels and the CTA band |

**Elevation:** flat by default. Borders (`line`) separate things on the
canvas. Shadow is reserved for what floats above the page:

- `shadow-lift`: `0 1px 2px rgb(18 63 40 / .06), 0 4px 12px rgb(18 63 40 / .06)`, for the selected table row and hovered cards
- `shadow-float`: `0 12px 40px rgb(18 63 40 / .14)`, for drawers, menus, dialogs and the command palette

Shadows are tinted with `green-deep`, not black.

---

## Marketing

### Shell

- **Nav:** coin logo + "Ikigai" left; links centred-right in DM Sans 500;
  one green CTA button on the right. The current link is marked with a 2px
  `green` underline, not a filled pill. Sticky, `surface` at 85% with a backdrop
  blur, a `line` border appearing only after scroll. On mobile, a sheet menu.
- **Footer:** `green-deep` ground, `sidebar-ink` text, white headings. The
  coin logo, the tagline, link columns, and the app store badge.

### Tone

Editorial and calm, not playful. The first prototype used pastel discs, tinted
icon cards and pill buttons, and it read as childish for an organisation whose
work includes safeguarding and mental health. The corrections:

- **Hairlines, not tinted boxes.** Groups of items sit in columns under a
  1px rule, not in pastel cards.
- **Fraunces carries the character.** Headlines, section titles, card titles
  and numbers. Letter-spacing `-0.01em` to `-0.015em` at display sizes.
- **Small uppercase overlines** (`12px`, `+0.12em`) introduce sections instead
  of badges and chips.
- **Brand colours are accents, never grounds.** Soft brand tints belong to
  admin status chips, not to marketing sections. On the site, colour appears
  as `green-deep` blocks, `green` actions, the `sun` italic in the hero, and
  stage numerals.
- **Show the real product.** Actual app screenshots in phone frames do the
  work that stock imagery would otherwise do, and stay honest.
- **Icons are line icons in `green`**, 22px, without a coloured container.

### Hero

A full-width `green-deep` block, inset `16px` from the page edges with a
`24px` radius, directly under the nav.

- **Left:** the overline in `sidebar-ink`, then the headline in white at
  `clamp(2.8rem, 6vw, 5rem)`, `-0.02em`. The key phrase is set in **Fraunces
  italic in `sun`**: "Find your *reason for being*". (`sun` on `green-deep` is
  7.4:1; this is the one place `sun` is used for text.) A lede in `#CFE0D4` at
  `42ch`, then **Get the app** (white button) and **Partner with us**
  (outlined in 35% white).
- **Right:** a **real screenshot of the mobile app** in a phone frame (`42px`
  radius, near-black bezel, deep shadow), over the four ikigai circles drawn
  as thin `sidebar-ink` lines at low opacity. The screenshot must be a current
  capture of the real app, not a mock-up, and must not show demo people.
- **Bottom:** the four `impact_stats` figures in a bar across the foot of the
  hero, on a 18% black overlay, white numbers, `sidebar-ink` labels.
- On load, the copy and phone rise `14px` (transform only, never from
  `opacity: 0`); off under reduced motion.
- When real photography exists, one photo may take the phone's place. Never a
  collage.

### Home page, in order

| Section | Pattern | Empty behaviour |
|---|---|---|
| Hero | As above, with the impact bar | Impact bar hides if `impact_stats` is empty |
| Mission | The tagline set large in Fraunces (`clamp(1.9rem, 3.8vw, 3.1rem)`), its last phrase in `ink-faint`, under an overline | Static |
| The four questions | Four columns under a `green-deep` rule: line icon, Fraunces title, one sentence | CMS-driven; always seeded |
| The app | Full-width white band. Left: heading, four feature rows between hairlines (icon, bold title, one line), **Get the app**. Right: two real app screenshots in phone frames, overlapped and slightly rotated, on a `ground-site` panel | Static; screenshots refreshed when the app changes |
| Safe by design | Three columns under a rule: guardian consent, mentor verification, concerns reaching a person. Only claims the product actually delivers | Static |
| Programmes | **One featured programme** as a large card (title at `2.4rem`, first paragraph, a When / Where / Ages row under a hairline), with the next two as standard cards stacked beside it | Published only; one programme shows full width; none hides the section |
| Stories | Quote, name and role, in Fraunces italic between rules | **Hidden** until real rows exist |
| Partners / Team | Logo row / people grid | **Hidden** until real rows exist |
| CTA band | `green-deep` panel, Fraunces headline, a white button and an outlined one | Static |

### Other marketing pages

| Pattern | Use |
|---|---|
| Programme card | White, `12px` radius, no image: uppercase meta line (ages · place), Fraunces title, first sentence, "Learn more →". Hover turns the border `green` and slides the arrow `4px` |
| Stage columns | How it works: numerals `01`–`04` in Fraunces in the stage's text-safe ink, title, one sentence, under a rule |
| Page header | Overline, Fraunces display title, lede. No hero block on inner pages |

Sections sit on `ground-site` with `96px` between them; cards and white bands
supply the white.

---

## Admin

### Shell

```
┌────────────┬──────────────────────────────────────────────┬───────────┐
│ sidebar    │ breadcrumb                                   │           │
│ green-deep │ Page title                 [Secondary] [Primary]         │
│ 248px      │──────────────────────────────────────────────│  drawer   │
│            │ canvas (ground-admin), 24px padding          │  420px,   │
│ search ⌘K  │                                              │  opens    │
│ groups…    │                                              │  over the │
│            │                                              │  canvas   │
│ user card  │                                              │           │
└────────────┴──────────────────────────────────────────────┴───────────┘
```

**Canvas:** page content is capped at `1280px` and **centred** in the space
right of the sidebar, so on wide monitors it doesn't hug the sidebar with
empty space to the right. The CMS editor's field column is capped at `760px`
and centred in its pane.

**Sidebar** (ProfitPulse + Confidency): `green-deep`, the coin logo and
"Ikigai Admin" at the top, then a search field with a `⌘K` hint that opens the
command palette. Items are `sidebar-ink` with a lucide icon; the active item is
a white pill with `green-deep` text. Queues carry a count badge (`sun` ground,
`green-deep` text) of items waiting. The signed-in user's card is pinned to the
bottom, with sign out in its menu. It collapses to icons below 1280px and
becomes a sheet below 768px.

The 17 flat items today become five groups:

| Group | Items |
|---|---|
| **Overview** | Dashboard, Analytics |
| **Review** | Mentor verification ·badge, School vetting ·badge, Safeguarding ·badge, Reports ·badge, Enquiries ·badge |
| **People** | Users, Mentees, Mentors, Guardians, Clubs |
| **Programme** | Skills, Events, Notifications |
| **Website** | Content, Pages, Page builder, App copy |

Review sits second and carries the badges because it is where waiting has
consequences.

### Page header

Breadcrumb (`small`, `ink-muted`), then the Fraunces page title with an
optional meta line under it ("12 waiting · updated 2 min ago"), and actions
on the right: at most one primary, then secondary, then an overflow menu.

### Patterns

**1. Dashboard.** A row of KPI tiles (Confidency): an icon in a soft brand
square, a label, the `stat` number, and a delta with its context ("+8 vs last
week"; up is `leaf`, down is `#C8321F`, with an arrow as well as colour).
Below: a **Needs attention** card listing each queue with its count and oldest
item age, then the mentor pipeline, charts with a segmented period toggle, and
recent activity.

**2. Pipeline** (travel dashboard). Chevron stage headers in a row, cards
beneath each. For mentor verification: *Applied → Documents → Interview →
Decision*. Each card has the name, days in stage and a status chip. It is a
view of the same data as the queue table, switched with a segmented control,
not a separate screen.

**3. Table** (Confidency + ProfitPulse + travel dashboard).

- Above: a search field and filter chips with counts (`All 80`, `Pending 12`
  …), with sort and export on the right.
- Header: `label` style, `ink-muted`, on `surface`, sticky.
- Rows are 52px (comfortable) or 40px (compact, a per-user toggle). The first
  cell is a two-line name + email with an initials avatar coloured by
  `accentFor(id)`, the same hashing the mobile app uses, so a person keeps
  their colour across surfaces.
- Status is a chip. Scores (profile completeness, match quality) are an inline
  bar with the number beside it.
- Hover is `ground-admin`; **selected** lifts to `surface` + `shadow-lift`.
- Keyboard: `j`/`k` move, `Enter` opens, `x` selects, `/` focuses search.
- Footer: "Showing 1–10 of 80" left, pagination right.
- A bulk-action bar replaces the filter row when rows are selected.

**4. Record drawer** (ProfitPulse). Opening a row slides a 420px drawer over
the right of the canvas; the list stays in place and the URL gains `?id=`, so
the drawer is linkable and Back closes it. Top: close, the record's status
chip, and the date. Then the person header (avatar, name, role, contact
actions), then sections of facts and documents. A **sticky action footer**
holds the decision.

On the review queues the footer is always:

- **Approve** (green, primary) on the right, **Reject** (outlined, `danger`
  text) on the left, with space between them, never adjacent.
- Reject opens an inline reason field; the confirm button stays disabled
  until a reason is entered. This is already true for mentors and becomes
  uniform across schools, safeguarding and reports.
- After a decision, the drawer advances to the next item in the queue.

Full pages (`/mentors/[id]/verify`, `/schools/[id]/vet`) stay for deep review
and share the drawer's content component.

**5. CMS editor** (Untitled UI + orange CMS). One editor for all 11 CMS
sections, replacing the shared `resource-manager.tsx` form.

```
┌ breadcrumb › title                           [Save as draft] [Publish] ┐
├──────────────┬─────────────────────────────────────┬────────────────────┤
│ Outline      │ Fields, in order, each with a       │ Status  ● Draft    │
│ field list   │ type icon and label.                │ Visibility         │
│ with type    │ Rich text has a toolbar.            │ Slug / SEO         │
│ icons; drag  │ Images show the picked image with   │ Preview on site ↗  │
│ to reorder   │ replace / remove on hover.          │ Last edited by …   │
│ blocks       │                                     │                    │
├──────────────┴─────────────────────────────────────┴────────────────────┤
│ Saved 2 min ago                                   [Discard] [Save]      │
└─────────────────────────────────────────────────────────────────────────┘
```

The outline pane appears only for block-based content (home page, custom
pages, page builder); simple records (a partner, a team member) use the
centre and right panes. Marketing reads are `force-dynamic`, so **Publish**
is live immediately. The confirm toast says so: "Published. It's live on the
site now."

**6. States.**

- **Empty:** an icon in a soft brand disc, one sentence saying what will
  appear here, and the action that creates the first one. No illustrations of
  people.
- **Loading:** skeletons shaped like the content (rows, tiles), `line` colour,
  with a shimmer disabled under reduced motion.
- **Error:** what failed and what to do next, with a retry. Inline on the
  component that failed, not a full-page takeover.
- **Toast:** bottom-right, `surface` + `shadow-float`, the result in past
  tense ("Mentor approved"), with Undo where the action allows it.

---

## Components

Built once in `client/components/ui/`, in this order, before any page is
restyled. This is step 1 of plan 04.

| Component | Variants / notes |
|---|---|
| `Button` | `primary` (green), `secondary` (surface + `line-strong`), `ghost`, `danger`; sizes `sm 32` `md 40` `lg 46`; 10px radius on marketing, 8px on admin |
| `StatusChip` | the six status meanings above; `dot` option for tables |
| `CountBadge` | nav and tab counts |
| `Field` | label, input, hint, inline error from a server action's return shape |
| `Select`, `SearchField` | search shows the `⌘K` / `/` hint |
| `SegmentedControl` | period toggles, table/pipeline switch, density |
| `FilterChips` | with counts |
| `Table` | sticky header, density, selection, keyboard, pagination footer |
| `KpiTile` | icon, label, value, delta + context |
| `ScoreBar` | inline progress with number |
| `Pipeline` | chevron stage headers and cards |
| `Drawer` | 420px, URL-bound, sticky footer |
| `PageHeader` | breadcrumb, title, meta, actions (replaces `components/page-header.tsx`) |
| `AdminSidebar` | grouped, badges, search, user card |
| `Card` | `surface`, `line` border, 12px radius, header slot |
| `Avatar` | initials on `accentFor(id)`, image when present |
| `EmptyState`, `Skeleton`, `Toast` | as above |
| `RichTextToolbar`, `Editor` | CMS pattern 5 |
| `SiteNav`, `SiteFooter`, `Hero`, `ImpactBar`, `PhoneFrame`, `FeatureList`, `FeaturedProgramme`, `IkigaiDiagram`, `Overline` | marketing |

---

## Motion

- Hover and press: 120ms, colour and shadow only.
- Drawer and sheet: 220ms `cubic-bezier(.2,.8,.2,1)`, slide + fade.
- Marketing section reveal: the existing `fade-up`, from a visible resting
  state, never from `opacity: 0`.
- `prefers-reduced-motion` turns all of it into instant changes.

## Accessibility

Built to **WCAG 2.1 AA**. Plan 04 notes the target is not yet confirmed; this
guide assumes it, and every token above was checked against it.

- Focus: a 2px `green` ring with a 2px offset, on every interactive element,
  also inside the dark sidebar (there, the ring is `sun`).
- Targets: 44px minimum on marketing; admin rows and buttons at least 32px,
  with 40px the default.
- Status and deltas carry a word or an arrow, never colour alone.
- `sun` and `orange` are never used as text colours.
- Drawers and dialogs trap focus and return it to the row that opened them.

## Low bandwidth

- No background images, no hero video, no autoplay.
- App screenshots as WebP at 360px wide, about 20KB each. At most one hero
  photo. Images below the fold are lazy, `quality={60}`, with `sizes`
  attributes.
- Ornament is inline SVG under 2KB. Lucide icons are imported per icon.
- Lite Mode (`data-lite`) hides the hero photo, the diagram and the
  section reveals.

---

## Open questions

- **Admin dark mode.** Kept, as proposed above, or light only like mobile?
- **Hero copy and the two CTAs.** "Get the app" assumes a Play Store listing
  exists by launch.
- **Plan 00 still says the PWA stays**, which it justified by users who cannot
  afford a Play Store install. Plan 00 and plan 04's scope table need updating
  to record that it is dropped, and what the route in is for those users now.
