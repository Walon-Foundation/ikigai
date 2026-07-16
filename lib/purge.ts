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
  mentorDocuments,
  mentorReviews,
  milestones,
  pushNotifications,
  satisfactionSurveys,
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
  await db.delete(journalFeedback).where(eq(journalFeedback.mentorId, userId));
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

  for (const user of due) {
    await purgeUser(user.id);
  }
  return due.map((u) => u.id);
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
