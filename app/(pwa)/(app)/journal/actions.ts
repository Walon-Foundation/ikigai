"use server";

import { auth } from "@clerk/nextjs/server";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { journalEntries, milestones, users } from "@/db/schema";
import {
  flagsConcern,
  isJournalVisibility,
  MAX_JOURNAL_LENGTH,
} from "@/lib/journal";
import { dispatchToAdmins } from "@/lib/notifications/dispatch";

export async function saveJournalEntry(data: {
  content: string;
  visibility: string;
  // Who the client believes is writing. Optional, because a live compose always
  // belongs to the session that is posting it — this exists for the offline
  // queue, where an entry can outlive the session that wrote it.
  expectedOwnerId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // The offline journal (lib/offline-journal.ts) persists unsent entries in
  // IndexedDB on a device this audience frequently shares. Without this check
  // the replay path resolved the author from whoever happened to be signed in
  // when it ran — so a queued entry could be written into the next person's
  // journal, carrying its safeguarding flag onto the wrong child. The client
  // already refuses to replay another owner's entry; this is the same rule
  // stated where it cannot be bypassed.
  if (data.expectedOwnerId && data.expectedOwnerId !== userId) {
    throw new Error("This entry belongs to a different account");
  }

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

  const flagged = flagsConcern(content);

  const [entry] = await db
    .insert(journalEntries)
    .values({
      userId: user.id,
      content,
      visibility,
      // Recomputed here — never trust a client-supplied safety flag.
      keywordFlag: flagged,
    })
    .returning({ id: journalEntries.id });

  // A flagged entry used to set a boolean and wait to be noticed. The keyword
  // list exists to catch a child in trouble; catching them and telling nobody
  // is the same as not catching them.
  //
  // Nothing about the entry travels in the notification — not the author, not
  // a snippet. It says an entry was flagged and points at the queue, which is
  // behind requireAdmin(). A journal entry is private writing by a young
  // person, and a lock-screen preview is not a safeguarding review.
  if (flagged) {
    after(async () => {
      await dispatchToAdmins({ key: "JOURNAL_FLAGGED", dedupe: entry.id });
    });
  }

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
