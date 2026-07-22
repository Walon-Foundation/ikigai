import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db/db";
import {
  enquiries,
  events,
  galleryItems,
  impactStats,
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

/**
 * Public events only. `isPublic` defaults to false, so an internal activity
 * created by an admin for the app never appears here by omission.
 */
export async function getUpcomingPublicEvents(limit?: number) {
  const query = db
    .select()
    .from(events)
    .where(and(eq(events.isPublic, true), gte(events.startsAt, new Date())))
    .orderBy(asc(events.startsAt));
  return limit ? query.limit(limit) : query;
}

export async function getPastPublicEvents(limit = 24) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.isPublic, true), lt(events.startsAt, new Date())))
    .orderBy(desc(events.startsAt))
    .limit(limit);
}

export async function getPublicEvent(slug: string) {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublic, true)))
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
