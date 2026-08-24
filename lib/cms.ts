import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db/db";
import {
  enquiries,
  events,
  galleryItems,
  impactStats,
  marketingPages,
  pageBlocks,
  partners,
  pillars,
  programmes,
  siteCopy,
  stories,
  teamMembers,
} from "@/db/schema";

// Public-website reads.
//
// These are plain, uncached database reads. The marketing pages that call them
// are dynamic (server-rendered per request) — see the `export const dynamic`
// in each page — so an admin edit is visible the instant it is saved, which is
// the behaviour that was asked for.
//
// This deliberately does NOT use unstable_cache or `use cache`:
//   - `use cache` needs cacheComponents: true, a whole-application flag that
//     would change how every route in the PWA renders. This work is not allowed
//     to disturb the app.
//   - unstable_cache caches the data, but a statically-prerendered page freezes
//     its HTML at build time; a data-tag invalidation does not regenerate that
//     HTML, so an edit would not appear until the next deploy. Verified against
//     this Next version (16.2.5) before choosing this approach.
//
// The cost is a handful of Postgres reads per marketing request. The functions
// run in iad1, colocated with the Neon database, and every page batches its
// reads with Promise.all — so the round-trips happen in parallel and add tens
// of milliseconds, dwarfed by the visitor's own network latency. Marketing
// traffic is a fraction of app traffic. Correctness and "the edit shows up now"
// are worth that.

/** jsonb columns come back as `unknown`; the CMS only ever writes string[]. */
function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

export async function getPillars() {
  return db
    .select()
    .from(pillars)
    .where(eq(pillars.published, true))
    .orderBy(asc(pillars.orderIndex));
}

export async function getProgrammes() {
  return db
    .select()
    .from(programmes)
    .where(eq(programmes.published, true))
    .orderBy(asc(programmes.orderIndex));
}

/**
 * Programmes grouped under their pillar, in one round-trip, for the homepage
 * and /what-we-do. A pillar with no published programmes still appears — the
 * four pillars are the organisation's structure, and one of them silently
 * vanishing because its programme is mid-edit would be worse than an empty one.
 */
export async function getPillarsWithProgrammes() {
  const [pillarRows, programmeRows] = await Promise.all([
    db
      .select()
      .from(pillars)
      .where(eq(pillars.published, true))
      .orderBy(asc(pillars.orderIndex)),
    db
      .select()
      .from(programmes)
      .where(eq(programmes.published, true))
      .orderBy(asc(programmes.orderIndex)),
  ]);

  return pillarRows.map((pillar) => ({
    ...pillar,
    programmes: programmeRows.filter((p) => p.pillarId === pillar.id),
  }));
}

export async function getFeaturedProgrammes() {
  return db
    .select()
    .from(programmes)
    .where(and(eq(programmes.published, true), eq(programmes.featured, true)))
    .orderBy(asc(programmes.orderIndex));
}

/** One programme with its pillar and photos, for /programmes/[slug]. */
export async function getProgramme(slug: string) {
  const [row] = await db
    .select({ programme: programmes, pillar: pillars })
    .from(programmes)
    .leftJoin(pillars, eq(programmes.pillarId, pillars.id))
    .where(and(eq(programmes.slug, slug), eq(programmes.published, true)))
    .limit(1);

  if (!row) return null;

  const photos = await db
    .select()
    .from(galleryItems)
    .where(
      and(
        eq(galleryItems.programmeId, row.programme.id),
        eq(galleryItems.published, true),
      ),
    )
    .orderBy(asc(galleryItems.orderIndex));

  return {
    ...row.programme,
    objectives: stringList(row.programme.objectives),
    activities: stringList(row.programme.activities),
    pillar: row.pillar,
    photos,
  };
}

export async function getStories(limit?: number) {
  const query = db
    .select()
    .from(stories)
    .where(eq(stories.published, true))
    .orderBy(desc(stories.publishedAt));
  return limit ? query.limit(limit) : query;
}

export async function getStory(slug: string) {
  const [row] = await db
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), eq(stories.published, true)))
    .limit(1);
  return row ?? null;
}

/** Gallery items grouped into albums, ordered as curated. */
export async function getGalleryAlbums() {
  const rows = await db
    .select()
    .from(galleryItems)
    .where(eq(galleryItems.published, true))
    .orderBy(asc(galleryItems.album), asc(galleryItems.orderIndex));

  const albums = new Map<string, typeof rows>();
  for (const item of rows) {
    const existing = albums.get(item.album);
    if (existing) existing.push(item);
    else albums.set(item.album, [item]);
  }
  return [...albums.entries()].map(([album, items]) => ({ album, items }));
}

export async function getPartners() {
  return db
    .select()
    .from(partners)
    .where(eq(partners.published, true))
    .orderBy(asc(partners.orderIndex));
}

export async function getImpactStats() {
  return db
    .select()
    .from(impactStats)
    .where(eq(impactStats.published, true))
    .orderBy(asc(impactStats.orderIndex));
}

export async function getTeam() {
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.published, true))
    .orderBy(asc(teamMembers.orderIndex));
}

/**
 * A singleton copy block. Returns null when unset so callers fall back to the
 * copy shipped in the component — a missing row must never render a blank hero.
 */
export async function getCopy(key: string) {
  const [row] = await db
    .select()
    .from(siteCopy)
    .where(eq(siteCopy.key, key))
    .limit(1);
  return (row?.value as Record<string, unknown> | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Unified date-lifecycle helpers — shared by events and programmes.
//
// A volunteer must not be able to volunteer for something that has already
// ended (user request: "a volunteer can't volunteer for a past thing").
// Both tables use the same rule:
//   - if endsAt exists, it is authoritative;
//   - else if startsAt exists, a single-day thing ends at startsAt;
//   - else (no dates at all) the item is considered dateless → never past
//     (so seeded rows without dates stay active).
// ongoing = started && not yet ended; upcoming = not yet started; past = ended.
// allowVolunteer / allowJoin are manual admin kill-switches on top of dates.
// ---------------------------------------------------------------------------

type Dated = {
  startsAt?: Date | null;
  endsAt?: Date | null;
  allowVolunteer?: boolean | null;
  allowJoin?: boolean | null;
};

function effectiveEnd(item: Dated): number | null {
  if (item.endsAt) return item.endsAt.getTime();
  if (item.startsAt) return item.startsAt.getTime();
  return null; // dateless → no end
}

export function isPast(item: Dated, now = Date.now()): boolean {
  const end = effectiveEnd(item);
  if (end === null) return false;
  return end < now;
}

export function isOngoing(item: Dated, now = Date.now()): boolean {
  if (!item.startsAt) return false;
  const start = item.startsAt.getTime();
  const end = effectiveEnd(item) ?? start;
  return start <= now && end >= now;
}

export function isUpcoming(item: Dated, now = Date.now()): boolean {
  if (isPast(item, now)) return false;
  if (!item.startsAt) return false;
  return item.startsAt.getTime() > now;
}

export type ItemStatus = "upcoming" | "ongoing" | "past" | "dateless";

export function getItemStatus(item: Dated, now = Date.now()): ItemStatus {
  if (effectiveEnd(item) === null) return "dateless";
  if (isPast(item, now)) return "past";
  if (isOngoing(item, now)) return "ongoing";
  return "upcoming";
}

// Programme-specific aliases (same logic, clearer call sites)
export const isProgrammePast = isPast;
export const isProgrammeOngoing = isOngoing;
export const isProgrammeActive = (p: Dated, now = Date.now()) =>
  !isPast(p, now);
export const programmeStatus = getItemStatus;
export const isEventPast = isPast;
export const isEventOngoing = isOngoing;
export const eventStatus = getItemStatus;

/** Whether volunteering / joining should be allowed for this item right now. */
export function canVolunteer(item: Dated, now = Date.now()): boolean {
  if (item.allowVolunteer === false) return false;
  return !isPast(item, now);
}

export function canJoin(item: Dated, now = Date.now()): boolean {
  // programmes gate join via allowVolunteer; events have a dedicated allowJoin.
  // If allowJoin is explicitly false, block; otherwise fall back to allowVolunteer + dates.
  if (item.allowJoin === false) return false;
  if (item.allowVolunteer === false) return false;
  return !isPast(item, now);
}

/**
 * Filter for the volunteer dropdown: only published, not past, and not
 * manually closed via allowVolunteer. Mirrors canVolunteer but at the row
 * level for the CMS read.
 */
export async function getActiveProgrammesForVolunteer() {
  const rows = await db
    .select()
    .from(programmes)
    .where(eq(programmes.published, true))
    .orderBy(asc(programmes.orderIndex));
  const now = Date.now();
  return rows.filter((p) => canVolunteer(p as Dated, now));
}

/** Upcoming + ongoing public events that are still volunteerable. */
export async function getActiveEventsForVolunteer() {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.isPublic, true))
    .orderBy(asc(events.startsAt));
  const now = Date.now();
  return rows.filter((e) => canVolunteer(e as Dated, now));
}

/**
 * Public events only. `isPublic` defaults to false, so an internal activity
 * created by an admin for the app never appears here by omission.
 *
 * An event that has started but not yet ended is still joinable ("ongoing"),
 * so upcoming means endsAt (or startsAt if no end) is still in the future —
 * not just startsAt. Otherwise an event that began yesterday but ends
 * tomorrow would flip to "Past" while you can still join it.
 */
export async function getUpcomingPublicEvents(limit?: number) {
  // Work in JS filter for cross-driver null handling; the table is small for
  // public listing. For larger tables this would be a coalesce SQL predicate.
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.isPublic, true))
    .orderBy(asc(events.startsAt));
  const now = Date.now();
  const upcoming = rows.filter((e) => !isPast(e as Dated, now));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export async function getPastPublicEvents(limit = 24) {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.isPublic, true))
    .orderBy(desc(events.startsAt));
  const now = Date.now();
  return rows.filter((e) => isPast(e as Dated, now)).slice(0, limit);
}

export async function getPublicEvent(slug: string) {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublic, true)))
    .limit(1);
  return row ?? null;
}

/** Published page-builder blocks for one page, in display order. */
export async function getPageBlocks(page: string) {
  return db
    .select()
    .from(pageBlocks)
    .where(and(eq(pageBlocks.page, page), eq(pageBlocks.published, true)))
    .orderBy(asc(pageBlocks.orderIndex));
}

/** A published admin-created page (app/(marketing)/[slug]/page.tsx). */
export async function getMarketingPage(slug: string) {
  const [row] = await db
    .select()
    .from(marketingPages)
    .where(
      and(eq(marketingPages.slug, slug), eq(marketingPages.published, true)),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Record a public enquiry — the one write in this file, called by the Get
 * Involved and contact forms.
 */
export async function createEnquiry(input: {
  type: "volunteer" | "mentor" | "partner" | "programme" | "contact";
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  message?: string;
  details?: Record<string, unknown>;
}) {
  await db.insert(enquiries).values({
    type: input.type,
    name: input.name,
    email: input.email,
    phone: input.phone,
    organization: input.organization,
    message: input.message,
    details: input.details,
  });
}
