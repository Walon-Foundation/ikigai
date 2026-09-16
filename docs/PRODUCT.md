# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mentee and mentor are the primary users — the mentorship relationship (both sides) is the core loop the product is built around. Parent/guardian, school club lead, and admin are supporting roles that serve that relationship (oversight, vetting, safeguarding, platform operations) rather than driving the primary product loop themselves.

## Product Purpose

A purpose-discovery and mentorship platform for young people in Freetown & the Western Rural Area, Sierra Leone. It helps youth discover purpose, build confidence, and prioritize mental wellness by pairing a structured self-discovery process (journaling, a milestone-based Growth Tree, a Purpose Book) with verified human mentorship, plus safety tooling for girls and young women.

## Positioning

The differentiator is the purpose-discovery methodology itself — the Ikigai framework, expressed as journaling, growth-tree milestone tracking, and the purpose book — as a structured self-discovery mechanism, not just mentor matching and chat. A generic mentorship or wellness app could copy the matching/messaging layer; it could not copy this structured discovery process without becoming the same product.

## Operating Context

- Freetown & Western Rural Area, Sierra Leone; built for **low-bandwidth environments** (PWA, offline-first journal, installable).
- Two distinct visual/product surfaces:
  - The authenticated PWA (`app/(pwa)/`) — mentee/mentor/parent/club-lead product surface. **Must not be disturbed** by unrelated work (confirmed constraint from prior session).
  - The public marketing site (`app/(marketing)/`) — reads the CMS DB directly with no cache (`force-dynamic`) so admin content edits appear instantly; this is a deliberate architectural choice, not an oversight.
- Admin panel (`app/admin/`, subdomain-routed in production) is a separate operate-mode surface: mentor verification, school vetting, safeguarding queue, KPI analytics, push notification sender, user management, and the CMS.
- `plan.md` in the repo describes an aspirational Turborepo monorepo (`apps/app`, `apps/admin`, `packages/db`, `packages/ui`) that **does not match** the current implementation (single Next.js app with route groups). Treat `plan.md` as historical/aspirational, not current architecture.

## Capabilities and Constraints

- Mentorship: matching (`lib/match.ts`) + in-app messaging.
- Journal: private and mentor-visible entries, offline-capable.
- Growth Tree: milestone-based visual progress tracker.
- Purpose Book: structured self-discovery artifact.
- Pad Her Power: resource map and safety information for girls/young women.
- School Clubs: club leads register and manage school Ikigai clubs.
- Guardian/parent portal for oversight of minors.
- Safeguarding: safety report queue for admin review.
- Payments infra exists (Monime — payment plans, invoices), but a recent commit dropped the pricing step from onboarding — current monetization flow status is **undecided/open**, not to be assumed as active.

## Brand Commitments

- Name "Ikigai" (Japanese concept, "reason for being") is fixed.
- Tagline in use: "Empowering youth to discover purpose, build confidence, and prioritize mental wellness."
- No formal visual identity file exists — only PWA icon PNGs (`public/icon-192x192.png`, `icon-512x512.png`). No logo SVG or brand guide found; visual identity is otherwise undecided.

## Evidence on Hand

Checked the live CMS tables directly (2026-08-20):

- `impact_stats` (4 published rows) has real, specific figures: "2,000+ Girls reached", "100 Girls introduced to STEM", "50 Young people mentored", "Multiple Community campaigns" — treat as real evidence, safe to reference.
- `stories`, `gallery_items`, `partners`, `team_members` are all **empty (0 rows)** — no real testimonials, photos, partner logos, or team bios exist yet. Future work must not fabricate or imply these exist.
- `programmes` has 10 rows (mixed published/draft — some drafts seeded deliberately, per prior session).

## Product Principles

1. Purpose-discovery is the product, not a feature bolted onto mentorship — journaling, growth tree, and purpose book come first; mentorship supports the discovery process.
2. Design for low-bandwidth, offline-first use in Freetown/Western Rural Sierra Leone — never assume reliable connectivity or high-end devices.
3. Youth safety is a binding constraint, not a nice-to-have — guardian oversight, mentor vetting, and safeguarding reporting are core infrastructure.
4. Marketing content must reflect actual CMS data, not fabricated claims — the site currently has real impact numbers but no real stories/photos/partners yet.

## Accessibility & Inclusion

Low-bandwidth optimization is an explicit, confirmed design constraint. No specific WCAG level or additional accessibility standard has been confirmed yet.
