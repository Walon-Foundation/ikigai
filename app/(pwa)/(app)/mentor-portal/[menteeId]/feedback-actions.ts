"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { journalEntries, journalFeedback, mentorships } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

const MAX_COMMENT = 1_000;

// A mentor leaves feedback on a mentee's shared journal entry. Only allowed for
// entries the mentee shared (mentor_only / community) and only by a mentor with
// an active mentorship with that mentee.
export async function addJournalFeedback(data: {
  entryId: string;
  menteeId: string;
  comment: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (me.role !== "mentor") throw new Error("Forbidden");

  const comment =
    typeof data.comment === "string"
      ? data.comment.trim().slice(0, MAX_COMMENT)
      : "";
  if (!comment) throw new Error("Empty comment");

  // Confirm an active mentorship.
  const [link] = await db
    .select({ id: mentorships.id })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.menteeId, data.menteeId),
        eq(mentorships.mentorId, me.id),
        eq(mentorships.status, "active"),
      ),
    )
    .limit(1);
  if (!link) throw new Error("No active mentorship with this mentee");

  // Confirm the entry belongs to the mentee and is shared (not private).
  const [entry] = await db
    .select({
      id: journalEntries.id,
      userId: journalEntries.userId,
      visibility: journalEntries.visibility,
    })
    .from(journalEntries)
    .where(eq(journalEntries.id, data.entryId))
    .limit(1);
  if (!entry || entry.userId !== data.menteeId) {
    throw new Error("Entry not found");
  }
  if (!["mentor_only", "community"].includes(entry.visibility ?? "private")) {
    throw new Error("This entry is private");
  }

  await db
    .insert(journalFeedback)
    .values({ entryId: data.entryId, mentorId: me.id, comment });

  revalidatePath(`/mentor-portal/${data.menteeId}`);
}

// Helper: load shared entries + their feedback for the detail page.
//
// One left join, not two queries. Fetching the entries and then their feedback
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
