"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { groups } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";

const MAX_REASON = 500;

/**
 * Take a club off the public website, or put it back.
 *
 * Clubs publish automatically — that is the programme rule — which means the
 * only moderation available is after the fact, and this is it. Hiding is not
 * deleting: the club keeps working inside the app for the mentees in it, and
 * only its public listing goes away. A club whose CONTENT is the problem is a
 * safeguarding matter, not a visibility one, and belongs in that queue.
 */
export async function setClubVisibility(data: {
  clubId: string;
  hidden: boolean;
  reason?: string;
}) {
  await requireAdmin();
  if (typeof data.clubId !== "string" || !data.clubId) {
    throw new Error("Invalid club");
  }

  const reason =
    typeof data.reason === "string"
      ? data.reason.trim().slice(0, MAX_REASON)
      : "";
  if (data.hidden && !reason) {
    throw new Error("A reason is required to hide a club");
  }

  await db
    .update(groups)
    .set(
      data.hidden
        ? { hiddenAt: new Date(), hiddenReason: reason }
        : { hiddenAt: null, hiddenReason: null },
    )
    .where(eq(groups.id, data.clubId));

  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
}

/**
 * Clear a club's safeguarding keyword flag.
 *
 * The flag is a prompt to look, not a verdict. Once an admin has looked and the
 * club is fine, the flag has to be clearable or the queue fills with items
 * nobody can resolve and everyone learns to ignore.
 */
export async function clearClubFlag(clubId: string) {
  await requireAdmin();
  if (typeof clubId !== "string" || !clubId) throw new Error("Invalid club");
  await db
    .update(groups)
    .set({ keywordFlag: false })
    .where(eq(groups.id, clubId));
  revalidatePath("/admin/clubs");
}
