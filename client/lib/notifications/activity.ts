import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { users } from "@/db/schema";

// How stale users.lastActiveAt is allowed to get before it is rewritten.
//
// The column exists to answer "has this person been away for four days?", so
// hours of precision are ample and writing on every page render would add an
// UPDATE to every navigation in the app for no gain. Six hours puts the ceiling
// at four writes per user per day.
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/**
 * Record that this user is here, if it has been a while since we last did.
 *
 * Called from the app shell, so it runs once per navigation for every signed-in
 * person. It must therefore be cheap and it must never throw: a failed activity
 * write is not a reason to fail a page.
 */
export async function touchLastActive(user: {
  id: string;
  lastActiveAt: Date | null;
}): Promise<void> {
  const last = user.lastActiveAt?.getTime() ?? 0;
  if (Date.now() - last < STALE_AFTER_MS) return;

  try {
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (err) {
    console.error("notifications: failed to record activity", err);
  }
}
