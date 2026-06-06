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
export async function getSharedJournals(menteeId: string) {
  const entries = await db
    .select({
      id: journalEntries.id,
      content: journalEntries.content,
      visibility: journalEntries.visibility,
      createdAt: journalEntries.createdAt,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, menteeId),
        inArray(journalEntries.visibility, ["mentor_only", "community"]),
      ),
    )
    .orderBy(journalEntries.createdAt);

  if (entries.length === 0) return [];

  const feedback = await db
    .select()
    .from(journalFeedback)
    .where(
      inArray(
        journalFeedback.entryId,
        entries.map((e) => e.id),
      ),
    );

  return entries.map((e) => ({
    ...e,
    feedback: feedback.filter((f) => f.entryId === e.id),
  }));
}
