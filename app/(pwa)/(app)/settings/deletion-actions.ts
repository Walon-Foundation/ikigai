"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { DELETION_GRACE_DAYS } from "@/lib/purge";

/**
 * Ask for the account to be deleted.
 *
 * This marks the account rather than erasing it. The purge runs after a
 * grace period (lib/purge.ts) and signing in cancels the request. Many of the
 * mentees here are minors; an impulsive deletion at a bad moment should be
 * recoverable, and an irreversible button that fires on one tap is the wrong
 * shape for this platform.
 */
export async function requestAccountDeletion() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await db
    .update(users)
    .set({ deletionRequestedAt: new Date() })
    .where(eq(users.clerkId, userId));

  revalidatePath("/settings");
  return { graceDays: DELETION_GRACE_DAYS };
}

export async function cancelAccountDeletion() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await db
    .update(users)
    .set({ deletionRequestedAt: null })
    .where(eq(users.clerkId, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
