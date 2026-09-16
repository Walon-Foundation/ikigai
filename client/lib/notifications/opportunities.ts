import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import { events, users } from "@/db/schema";
import { dispatchMany } from "./dispatch";

// "A new opportunity matches your interests" — the one notification driven by
// content rather than by something a person did.
//
// Matched on interest tags, the free vocabulary already shared by
// users.interestTags, groups.interestTags and now events.interestTags.
//
// Compared in JS with case folding, exactly as lib/clubs.ts scores clubs, and
// deliberately not with Postgres's `&&` array-overlap operator. These tags are
// free text somebody typed: "Public Speaking" and "public speaking" are the
// same interest to every human involved, and `&&` would quietly match neither
// to the other. The set of mentees is small and this runs once per event.
//
// Only `events` participates. `programmes` was the other candidate and is
// deliberately left out: it is marketing-only content with no page inside the
// PWA (see the CMS section of db/schema.ts), so a notification about one would
// have to throw the mentee out of the app onto the website, where there is
// nothing for them to do. Events have /activities/<id>, with a real RSVP on it.
// If programmes should notify later, it is a catalogue entry and a query — the
// decision, not the plumbing, is what is missing.

/**
 * Announce an event to the mentees whose interests overlap it.
 *
 * Silent — and cheap, one short-circuited query — unless the event is public,
 * still in the future, and actually tagged. Deduped per event, so re-publishing
 * or editing an event never notifies the same person twice.
 */
export async function announceEvent(eventId: string): Promise<number> {
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      tags: events.interestTags,
      isPublic: events.isPublic,
      startsAt: events.startsAt,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event?.isPublic) return 0;
  if (!event.tags || event.tags.length === 0) return 0;
  // Nobody wants to hear about something that has already happened.
  if (event.startsAt.getTime() < Date.now()) return 0;

  const wanted = normalize(event.tags);

  const mentees = await db
    .select({
      id: users.id,
      email: users.email,
      subscription: users.pushSubscription,
      prefs: users.notificationPrefs,
      interestTags: users.interestTags,
    })
    .from(users)
    .where(and(eq(users.role, "mentee"), isNull(users.deletedAt)));

  const matches = mentees.filter((m) =>
    [...normalize(m.interestTags)].some((tag) => wanted.has(tag)),
  );
  if (matches.length === 0) return 0;

  const result = await dispatchMany(matches, {
    key: "OPPORTUNITY_MATCH",
    vars: { title: event.title, eventId: event.id },
    dedupe: event.id,
  });
  return result.persisted;
}

/** Same normalisation lib/clubs.ts uses, so the two agree on what a tag is. */
function normalize(tags: string[] | null | undefined): Set<string> {
  return new Set(
    (tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
  );
}
