import "server-only";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/db/db";
import {
  eventAttendance,
  goals,
  groupMembers,
  growthTrees,
  guardianLinks,
  journalEntries,
  journalFeedback,
  meetingVerifications,
  mentorDocuments,
  mentorReviews,
  mentorships,
  milestones,
  pushNotifications,
  satisfactionSurveys,
  skillMilestones,
  skillTracks,
  users,
} from "@/db/schema";

/** How long a user has to change their mind, from Settings, before the purge. */
export const DELETION_GRACE_DAYS = 30;

/**
 * Irreversibly scrub a user account.
 *
 * This is anonymise-and-retain, not DROP. The three rules it implements, each
 * chosen deliberately:
 *
 *  1. The `users` row SURVIVES, scrubbed. safety_reports.reported_id points at
 *     it, and an adult reported for harming a child must not be able to erase
 *     the report by deleting their own account. Everything identifying is
 *     cleared; the row becomes a tombstone that keeps foreign keys — and the
 *     safeguarding record — intact.
 *
 *  2. Private content is DELETED: journal entries, goals, growth tree,
 *     notifications, survey answers. This is the user's own material and nobody
 *     else's; there is no reason to keep it.
 *
 *  3. Messages are KEPT, attributed to the tombstone. A chat is half the other
 *     party's conversation. Deleting it would silently gut a mentor's record of
 *     a relationship they were equally part of — and on a safeguarding platform,
 *     an exchange that someone might later need to point at.
 *
 * Mentorships are kept for the same reason as messages: the mentor's history.
 * Payments and invoices are kept because they are financial records.
 */
export async function purgeUser(userId: string): Promise<void> {
  // Content that belongs to this user alone.
  //
  // Both directions of journal feedback have to go before the entries do.
  // journal_feedback.entry_id is NOT NULL with no ON DELETE behaviour (the
  // schema is pushed, so there is no migration adding one), which means a
  // mentor's comment left on this user's entry is a foreign key pointing at a
  // row we are about to delete — deleting only by mentorId raised a constraint
  // violation and aborted the purge partway through, leaving the account
  // half-scrubbed. Clearing feedback ON their entries as well as feedback BY
  // them is also the right privacy answer: a comment quoting a child's journal
  // entry is that child's data no matter who typed it.
  await db.delete(journalFeedback).where(eq(journalFeedback.mentorId, userId));
  await db
    .delete(journalFeedback)
    .where(
      inArray(
        journalFeedback.entryId,
        db
          .select({ id: journalEntries.id })
          .from(journalEntries)
          .where(eq(journalEntries.userId, userId)),
      ),
    );
  await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
  await db.delete(goals).where(eq(goals.userId, userId));
  await db.delete(growthTrees).where(eq(growthTrees.userId, userId));
  await db
    .delete(pushNotifications)
    .where(eq(pushNotifications.userId, userId));
  await db.delete(milestones).where(eq(milestones.userId, userId));
  await db.delete(groupMembers).where(eq(groupMembers.userId, userId));
  await db.delete(eventAttendance).where(eq(eventAttendance.userId, userId));
  await db
    .delete(satisfactionSurveys)
    .where(eq(satisfactionSurveys.userId, userId));
  // Reviews this user wrote. Reviews written ABOUT them (mentorId) stay — they
  // are other people's words about a mentor, not this user's data.
  await db.delete(mentorReviews).where(eq(mentorReviews.authorId, userId));

  // The skill track and its milestones are this mentee's own progress record —
  // same category as goals and the growth tree. Milestones first: their
  // skill_track_id is a NOT NULL foreign key onto the tracks.
  await db
    .delete(skillMilestones)
    .where(
      inArray(
        skillMilestones.skillTrackId,
        db
          .select({ id: skillTracks.id })
          .from(skillTracks)
          .where(eq(skillTracks.menteeId, userId)),
      ),
    );
  await db.delete(skillTracks).where(eq(skillTracks.menteeId, userId));

  // Meeting verifications for mentorships where this user was the MENTEE.
  // These rows carry lat/lng of a physical meeting between an adult and, very
  // often, a minor — the single most sensitive thing left behind by a purge
  // after the ID scans below. Mentorships themselves are kept for the mentor's
  // history (see the header), but nothing about that rationale requires keeping
  // a child's location, so the coordinates go with the account. Verifications
  // for mentorships where this user was the MENTOR are left alone: those are
  // the other party's meeting record, and deleting them would erase a minor's
  // evidence that a meeting happened.
  await db
    .delete(meetingVerifications)
    .where(
      inArray(
        meetingVerifications.mentorshipId,
        db
          .select({ id: mentorships.id })
          .from(mentorships)
          .where(eq(mentorships.menteeId, userId)),
      ),
    );

  // Vetting documents are the most sensitive thing this platform holds — a
  // scan of someone's national ID. Purging must remove the files themselves
  // from storage, not merely forget the keys, or a deleted mentor's ID would
  // outlive their account with nothing left pointing at it.
  const docs = await db
    .select({ fileKey: mentorDocuments.fileKey })
    .from(mentorDocuments)
    .where(eq(mentorDocuments.userId, userId));
  if (docs.length > 0) {
    await new UTApi()
      .deleteFiles(docs.map((d) => d.fileKey))
      .catch((err) => console.error("purge: could not delete documents", err));
    await db.delete(mentorDocuments).where(eq(mentorDocuments.userId, userId));
  }

  // Guardian links are a relationship, and the other side is often a child's
  // parent. Remove the link rather than leave a dangling consent.
  await db.delete(guardianLinks).where(eq(guardianLinks.parentId, userId));
  await db.delete(guardianLinks).where(eq(guardianLinks.childId, userId));

  // The tombstone. clerk_id is NOT NULL and unique, so it can't be nulled —
  // it's replaced with a value that can never match a real Clerk id, which also
  // means the account can never be signed into again.
  await db
    .update(users)
    .set({
      clerkId: `deleted:${userId}`,
      email: null,
      displayName: "Deleted user",
      avatarUrl: null,
      bio: null,
      interestTags: [],
      onboardingData: null,
      pushSubscription: null,
      schoolId: null,
      // A purged mentor is no longer an approved mentor. Both the marketplace
      // and the auto-matcher select on (role='mentor' AND verified_at IS NOT
      // NULL), so leaving this set would leave a tombstone browsable and
      // matchable as "Deleted user".
      verifiedAt: null,
      deletedAt: new Date(),
      deletionRequestedAt: null,
    })
    .where(eq(users.id, userId));
}

/**
 * Purge every account whose grace period has expired. Driven by the cron route.
 * Returns the ids purged so the caller can log a real number.
 */
export async function purgeExpiredAccounts(
  now = new Date(),
): Promise<string[]> {
  const cutoff = new Date(now.getTime() - DELETION_GRACE_DAYS * 86_400_000);

  const due = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        lt(users.deletionRequestedAt, cutoff),
        // Never purge twice.
        isNull(users.deletedAt),
      ),
    );

  // Each account is isolated. purgeUser touches a dozen tables and calls out to
  // UploadThing, so any one of them can fail — and an unhandled rejection here
  // propagated out through the cron route, which does not catch either. That
  // meant a single bad row aborted the whole run, and because the job is only
  // retried on the next schedule against the same data, the same row would
  // abort it again: every account queued behind it stayed unpurged
  // indefinitely, with nobody told. A deletion request that silently never
  // completes is the failure mode this platform can least afford. So we log and
  // carry on, and report only the ids that actually completed — the cron route
  // logs that count, and it must not claim accounts were purged when they
  // weren't. A failed account keeps deletionRequestedAt set and stays due, so
  // the next run picks it up again.
  const purged: string[] = [];
  for (const user of due) {
    try {
      await purgeUser(user.id);
      purged.push(user.id);
    } catch (err) {
      console.error(`purge: failed for user ${user.id}`, err);
    }
  }
  return purged;
}

/** Kept for callers that need to check a batch of ids. */
export async function areDeleted(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await db
    .select({ id: users.id, deletedAt: users.deletedAt })
    .from(users)
    .where(inArray(users.id, ids));
  return new Set(rows.filter((r) => r.deletedAt).map((r) => r.id));
}
