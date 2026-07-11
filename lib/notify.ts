import "server-only";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db/db";
import { pushNotifications, users } from "@/db/schema";
import { env } from "@/lib/env";

// Notification categories mirror the pushNotifications.type column.
export type NotifyType =
  | "nudge"
  | "match"
  | "milestone"
  | "broadcast"
  | "task"
  | "guardian";

let vapidConfigured = false;
function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return false;
  webpush.setVapidDetails(
    env.vapidSubject,
    env.vapidPublicKey,
    env.vapidPrivateKey,
  );
  vapidConfigured = true;
  return true;
}

/**
 * Deliver a notification to a user through both channels:
 *  1. Always persist a row in `push_notifications` — this is the in-app feed
 *     the bell reads, so it works even without VAPID keys or a subscription.
 *  2. Best-effort Web Push to the user's stored subscription (OS-level
 *     notification when the app is closed). Failures are swallowed; a
 *     subscription that is gone (404/410) is pruned.
 *
 * Never throws — notification delivery must not break the action that triggered
 * it (accepting a request, sending a message, etc.).
 */
export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  type: NotifyType;
  url?: string;
}): Promise<void> {
  const { userId, title, body, type, url } = input;

  try {
    await db.insert(pushNotifications).values({
      userId,
      title,
      body,
      type,
      url: url ?? null,
    });
  } catch (err) {
    console.error("notifyUser: failed to persist notification", err);
  }

  if (!ensureVapid()) return;

  try {
    const [row] = await db
      .select({ subscription: users.pushSubscription })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const subscription = row?.subscription as webpush.PushSubscription | null;
    if (!subscription) return;

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url ?? "/dashboard" }),
    );
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    // Subscription expired/unsubscribed — drop it so we stop retrying.
    if (statusCode === 404 || statusCode === 410) {
      await db
        .update(users)
        .set({ pushSubscription: null })
        .where(eq(users.id, userId))
        .catch(() => {});
    } else {
      console.error("notifyUser: web push failed", err);
    }
  }
}
