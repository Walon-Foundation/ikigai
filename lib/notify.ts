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

// Rows per insert when fanning out a broadcast. neon-http sends every query as
// its own HTTPS request, so the goal is few large inserts rather than many
// small ones — but one insert holding every user on the platform would be a
// single oversized request, so it's chunked.
const INSERT_CHUNK = 500;

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
export type NotifyPayload = {
  title: string;
  body: string;
  type: NotifyType;
  url?: string;
};

/**
 * Deliver the same notification to many users — the admin broadcast.
 *
 * Deliberately not a loop over notifyUser(): that would cost three network
 * round-trips per recipient (insert, subscription lookup, push) and over the
 * neon-http driver a broadcast to the whole platform would take minutes.
 * Instead the caller passes recipients it has already loaded, the feed rows go
 * in as a handful of bulk inserts, and the Web Push calls — which go to FCM,
 * not to us — are fired concurrently.
 *
 * Returns the number of users the notification actually reached, so the caller
 * can report a real count rather than a guess. Never throws.
 */
export async function notifyMany(
  recipients: { id: string; subscription: unknown }[],
  payload: NotifyPayload,
): Promise<number> {
  if (recipients.length === 0) return 0;
  const { title, body, type, url } = payload;

  let persisted = 0;
  for (let i = 0; i < recipients.length; i += INSERT_CHUNK) {
    const chunk = recipients.slice(i, i + INSERT_CHUNK);
    try {
      await db.insert(pushNotifications).values(
        chunk.map((r) => ({
          userId: r.id,
          title,
          body,
          type,
          url: url ?? null,
        })),
      );
      persisted += chunk.length;
    } catch (err) {
      console.error("notifyMany: failed to persist a chunk", err);
    }
  }

  if (ensureVapid()) {
    const subscribed = recipients.filter((r) => r.subscription);
    // allSettled, not all: one dead subscription must not abort the rest.
    await Promise.allSettled(
      subscribed.map(async (r) => {
        try {
          await webpush.sendNotification(
            r.subscription as webpush.PushSubscription,
            JSON.stringify({ title, body, url: url ?? "/dashboard" }),
          );
        } catch (err: unknown) {
          const statusCode =
            typeof err === "object" && err !== null && "statusCode" in err
              ? (err as { statusCode?: number }).statusCode
              : undefined;
          if (statusCode === 404 || statusCode === 410) {
            await db
              .update(users)
              .set({ pushSubscription: null })
              .where(eq(users.id, r.id))
              .catch(() => {});
          }
        }
      }),
    );
  }

  // The in-app feed is the channel that always works, so that is what "reached"
  // means. Web Push is a best-effort extra on top.
  return persisted;
}

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
