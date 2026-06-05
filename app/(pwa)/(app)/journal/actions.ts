"use server";

import { auth } from "@clerk/nextjs/server";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { journalEntries, milestones, users } from "@/db/schema";
import {
  flagsConcern,
  isJournalVisibility,
  MAX_JOURNAL_LENGTH,
} from "@/lib/journal";

export async function saveJournalEntry(data: {
  content: string;
  visibility: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Server-side validation: client args reach this function unverified.
  const content = typeof data.content === "string" ? data.content.trim() : "";
  if (!content) throw new Error("Entry is empty");
  if (content.length > MAX_JOURNAL_LENGTH) throw new Error("Entry too long");

  const visibility = isJournalVisibility(data.visibility)
    ? data.visibility
    : "private";

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");

  await db.insert(journalEntries).values({
    userId: user.id,
    content,
    visibility,
    // Recomputed here — never trust a client-supplied safety flag.
    keywordFlag: flagsConcern(content),
  });

  // Award first_journal milestone if this is their first entry
  const [{ total }] = await db
    .select({ total: count() })
    .from(journalEntries)
    .where(eq(journalEntries.userId, user.id));

  if (Number(total) === 1) {
    await db
      .insert(milestones)
      .values({ userId: user.id, type: "first_journal" })
      .onConflictDoNothing();
  }

  revalidatePath("/journal");
  return { success: true };
}
