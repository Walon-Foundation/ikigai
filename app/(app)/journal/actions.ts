"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { journalEntries, users, milestones } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function saveJournalEntry(data: {
  content: string;
  visibility: "private" | "mentor_only" | "community";
  keywordFlag: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");

  await db.insert(journalEntries).values({
    userId: user.id,
    content: data.content,
    visibility: data.visibility,
    keywordFlag: data.keywordFlag,
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
