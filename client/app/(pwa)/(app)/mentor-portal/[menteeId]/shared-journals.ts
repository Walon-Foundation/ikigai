import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { journalEntries, journalFeedback, mentorships } from "@/db/schema";

// NOT a server action — this module deliberately has no "use server" directive.
// Every exported async function in such a file becomes a public HTTP endpoint,
// callable by anyone holding the action id, with no session at all. This query
// authorizes by joining on `mentorId`, so as an action its only check was
// against a value the caller passed in — which is no check: it returned any
// mentee's shared journal entries to an unauthenticated caller who knew (or
// guessed) a (menteeId, mentorId) pair.
//
// Its sole caller is a server component, so a plain server-only module is the
// correct home. `mentorId` MUST come from the caller's own session — never from
// client input. Do not re-export this from a "use server" file.

// by id meant a second network round-trip that could only start once the first
// had landed — and over the neon-http driver a round-trip is the expensive part,
// not the row count. The join gets both in a single trip and the rows are
// regrouped in memory below.
// The caller runs this concurrently with its own access check, so this query
// carries the check itself: joining `mentorships` on (mentee, mentor, active)
// means a mentor without an active mentorship to this mentee matches no rows.
export async function getSharedJournals(menteeId: string, mentorId: string) {
  const rows = await db
    .select({
      id: journalEntries.id,
      content: journalEntries.content,
      visibility: journalEntries.visibility,
      createdAt: journalEntries.createdAt,
      feedback: journalFeedback,
    })
    .from(journalEntries)
    .innerJoin(
      mentorships,
      and(
        eq(mentorships.menteeId, journalEntries.userId),
        eq(mentorships.mentorId, mentorId),
        eq(mentorships.status, "active"),
      ),
    )
    // Left, not inner: an entry with no feedback yet must still appear.
    .leftJoin(journalFeedback, eq(journalFeedback.entryId, journalEntries.id))
    .where(
      and(
        eq(journalEntries.userId, menteeId),
        inArray(journalEntries.visibility, ["mentor_only", "community"]),
      ),
    )
    .orderBy(journalEntries.createdAt);

  // The join repeats an entry once per feedback row; fold them back together,
  // preserving the entry order the query returned.
  const byEntry = new Map<string, SharedJournal>();
  for (const row of rows) {
    let entry = byEntry.get(row.id);
    if (!entry) {
      entry = {
        id: row.id,
        content: row.content,
        visibility: row.visibility,
        createdAt: row.createdAt,
        feedback: [],
      };
      byEntry.set(row.id, entry);
    }
    if (row.feedback) entry.feedback.push(row.feedback);
  }

  return [...byEntry.values()];
}

type SharedJournal = {
  id: string;
  content: string;
  visibility: string | null;
  createdAt: Date | null;
  feedback: (typeof journalFeedback.$inferSelect)[];
};
