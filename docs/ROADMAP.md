# Ikigai Roadmap

> *Empowering youth to discover purpose, build confidence, and prioritize mental wellness — in Freetown & Western Rural Area, Sierra Leone.*

This roadmap replaces `plan.md` (which described an aspirational Turborepo monorepo that doesn't match the single-Next.js-app reality). It documents **where we are, where we're going, and how we'll know we're there** — across product, design, and tech.

---

## 1. Where we are (Aug 2026)

**Architecture:** Single Next.js 16 App Router. Three surfaces via subdomain routing (`proxy.ts`): marketing (`/`), PWA (`app.*` → `(pwa)`), admin (`admin.*` → `/admin`). Shared Neon Postgres + Drizzle `db/schema.ts`.

**What exists:**
- **Marketing** — CMS-driven (`lib/cms.ts`) pages: Home (`PageBlocks`), What We Do, Programmes, Pillars, Stories, Events, Gallery, Partners, Team (new), About, Contact, Privacy/Terms. Admin CMS at `/admin/cms` with publish/order, media library, page-builder blocks, app-copy.
- **PWA** — Clerk auth, role-aware onboarding, dashboard, Journey/Growth Tree, mentorship + messaging, groups, journal (offline via `idb` + sync), Pad Her Power/leaflet map, parent/mentor portals, activities/events RSVP (ongoing vs past, capacity + roadmap unlock gate), settings (lite mode, push, journal privacy, deletion grace `lib/purge.ts`).
- **Admin** — KPI dashboard, users, mentor verification (ID/CV via UploadThing signed URLs), schools, safeguarding, enquiries inbox, events attendance, analytics, page-builder, app-copy, notifications (web-push).
- **Infra** — Theme toggle (system + persisted `ThemeInit` + `ThemeToggle` on all 3 surfaces), favicon/meta, `sitemap.xml`/`robots.txt`, SEO metadata per marketing route, Lite Mode `data-lite`.

**What we just fixed:**
- Dark-mode on all 3 surfaces, removing forced `dark` wrappers.
- Favicon propagation to `admin.*` (proxy bypass).
- SEO: `metadataBase`, `openGraph`, per-page `generateMetadata`, no-index for PWA/admin, sitemap with programmes/stories/events.
- Team CMS → visible on `/team` + `/about` preview.
- Events lifecycle: `endsAt` gate (`lib/cms.ts`) for "ongoing" (started but not ended) vs past, `allowVolunteer/allowJoin` kill-switches, volunteer dropdown filtered to active programmes/events.
- Email: `lib/email.ts` (nodemailer) + mentor-approve email with PWA install link (`appUrl`) + enquiries handled email.

---

## 2. Product Principles (non-negotiable)

1. **Purpose-discovery is the product** — journal, growth tree, purpose book first; mentorship amplifies it.
2. **Low-bandwidth, offline-first** — PWA, `liteHidden`, `quality={60}`, no heavy JS on marketing hero (CSS `fade-up` not framer-motion).
3. **Safety as infrastructure** — guardian consent, mentor vetting, safeguarding queue, `adminNotes`, keyword flag — never a feature flag.
4. **No fabricated content** — `impact_stats` (4 real rows) is safe; `stories/partners/gallery/team` empty until seeded by the org.
5. **Edit shows immediately** — marketing reads are `force-dynamic`, no build-cache; correctness over milliseconds.

---

## 3. UI/UX Pillars

**Aesthetic:** Sierra Leone landscape → forest greens (`--primary #1A5C3A`), golden sunrise (`--accent #F5A623`), terracotta earth (`--earth #C05C3A`). Editorial display (`Fraunces` 900) + humanist body (`DM Sans`), mono only for codes. Quiet luxury, not purple gradients.

**System:**
- **Tokens** in `app/globals.css` (oklch) — `.dark` switches via `.dark` class + `color-scheme`.
- **Components** `components/ui/button.tsx` (`cva` variants) + `card.tsx` should be the source; raw `rounded-2xl border bg-card p-5` drift is debt — roadmap fixes it via gradual adoption.
- **Motion** — CSS `fade-up` for marketing hero, Framer for Growth Tree; `prefers-reduced-motion` respects stillness. Next: stagger reveals per-section, `y: -4` card lift on hover.
- **States** — empty (`border-dashed`), loading (`skeleton` respects Lite Mode), error (inline destructive, keep input).

**Next polish (this quarter):**
- Adopt `Button`/`Card` everywhere; single radius/spacing scale (`--radius`, `rounded-xl` → `rounded-2xl` consolidation).
- Theme transition smoothing (`background-color 200ms`).
- Grain / radial mesh on marketing hero (CSS only, Lite Mode hidden).
- Admin table density + keyboard nav; PWA `PageHeader` consistency on thread pages.

---

## 4. Roadmap

### Now (4 wks) — Trust & Clarity
- [x] Theme/tailwind + favicon/meta/sitemap/robots
- [x] Team publishing → public
- [x] Event lifecycle (ongoing vs past) + `allowJoin/allowVolunteer`
- [x] Volunteer-for select (active programmes + active events) + partner sponsorFor
- [x] Mentor approve → email with PWA install link (`appUrl`); enquiry handled → acceptance email
- [ ] Adopt `components/ui` in marketing + PWA (button drift) — *polish in this PR*
- [ ] `partners.tier` (permanent vs programme) grouping — *next migration*
- [ ] Partner CMS field: sponsor target disambiguation in enquiries `details`

### Next (8 wks) — Growth Loop Completion
- [ ] Growth Tree v2: organic branches `pathLength`, leaf physics, particle burst on level-up
- [ ] Journal share visibility fix shipped (settings toggle now persists) — add mentor feedback inline + growth archive timeline
- [ ] Pad Her Power: resource map clusters + offline caching + safety `help` offline banner
- [ ] Push nudges: cron for inactivity 4d, new match, milestone — verify `web-push` VAPID on Vercel
- [ ] Accessibility audit (WCAG 2.1 AA) + Lighthouse 3G >90 on marketing

### Next (12 wks) — Scale & Safety+
- [ ] Clubs: `schools` verification + clubhouse feed + bulk import
- [ ] Analytics v2: retention (Advocate in 90d), attendance rate, mentor capacity (`MENTOR_CAPACITY=2` `lib/match.ts`)
- [ ] Payments revisited (Monime) only if org confirms — schema `payment_plans/payments/invoices` stays but UI dormant (`PRODUCT.md:40` “undecided”)
- [ ] i18n: `Africa/Freetown` timezone alignment + Krio (`/locales/kri.json`)
- [ ] AI Phase 5: crisis severity classification (Claude API) + `Resend`/`Africa's Talking` fallback — behind feature flag

---

## 5. Engineering Guardrails

- **No monorepo churn** — stay single app until team size justifies Turborepo; `plan.md` historical.
- **DB** — run `bun run db:push` after schema edits; treat `programmes.startsAt/endsAt` as nullable (existing rows are evergreen). Indexes already annotated (`drizzle-orm/pg-core`) — keep them paired to queries (Neon HTTP = round-trip cost).
- **Email** — `lib/email.ts` no-ops to `console.log` when `SMTP_*` missing, so dev boots without creds. Add `SMTP_HOST/PORT/USER/PASS/FROM` in Vercel; verify `FROM` domain SPF/DKIM.
- **PWA** — `app/(pwa)/layout.tsx` registers `/sw.js`; keep `LiteModeInit` + `ThemeInit` both in `html > head` (FOUC-safe). `next/font` preload only `Fraunces`/`DM Sans`; `JetBrains_Mono` `preload:false`.
- **Testing** — manual cross-surface QA per PR: marketing (light/dark, Lite Mode), PWA (mentee/mentor/parent roles), admin (verify/vet/RSVP). Add Playwright later.

---

## 6. How to Use This Doc

- Propose changes via PR description linking to a Roadmap bullet.
- Close a bullet only when: code + admin-edit visible `force-dynamic`, empty state handled, and (if email/push) a `console.log` fallback verified.
- Update `README.md` “What it does” when a capability graduates from roadmap → shipped.

*Built for the youth of Sierra Leone. 🌱 — Ikigai, Aug 2026*
