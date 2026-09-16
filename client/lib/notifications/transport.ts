import "server-only";
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db/db";
import { pushNotifications, users } from "@/db/schema";
import { sendMail } from "@/lib/email";
import { notificationEmail, sendableAddress } from "@/lib/email/templates";
import { env } from "@/lib/env";
import type { LegacyNotifyType } from "./categories";

// The three channels, as dumb as they can be. Everything about WHETHER to send
// — preferences, priority, cooldown — is decided in dispatch.ts; this file only
// knows how to put a notification somewhere. Nothing here throws: a failed
// notification must never break the action that triggered it.

// Rows per insert when fanning out. neon-http sends every query as its own
// HTTPS request, so the goal is few large inserts rather than many small ones —
// but one insert holding every user on the platform would be a single oversized
// request, so it is chunked.
const INSERT_CHUNK = 500;

export type FeedRow = {
  userId: string;
  title: string;
  body: string;
  type: LegacyNotifyType;
  key: string;
  category: string;
  priority: string;
  channels: string[];
  url: string | null;
  dedupeKey: string | null;
  broadcastId: string | null;
};

/**
 * Write the in-app feed rows.
 *
 * Returns only the rows that were actually inserted. A row whose dedupeKey
 * already exists is dropped by the unique index rather than by a prior SELECT,
 * so two concurrent dispatches of the same event cannot both get through —
 * which is the whole reason the dedupe key is a database constraint and not an
 * application check.
 */
export async function insertFeedRows(
  rows: FeedRow[],
): Promise<{ id: string; userId: string | null }[]> {
  const inserted: { id: string; userId: string | null }[] = [];

  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK);
    try {
      const written = await db
        .insert(pushNotifications)
        .values(chunk)
        .onConflictDoNothing()
        .returning({
          id: pushNotifications.id,
          userId: pushNotifications.userId,
        });
      inserted.push(...written);
    } catch (err) {
      console.error("notifications: failed to persist a chunk", err);
    }
  }

  return inserted;
}

/**
 * Record that rows reached the push service or SMTP.
 *
 * This is what makes delivery answerable after the fact: a row with channels
 * containing "push" but a null pushedAt is a notification that was supposed to
 * be pushed and wasn't.
 */
export async function markDelivered(
  ids: string[],
  field: "pushedAt" | "emailedAt",
): Promise<void> {
  if (ids.length === 0) return;
  const now = new Date();
  try {
    for (let i = 0; i < ids.length; i += INSERT_CHUNK) {
      const chunk = ids.slice(i, i + INSERT_CHUNK);
      await db
        .update(pushNotifications)
        .set({ [field]: now })
        .where(inArray(pushNotifications.id, chunk));
    }
  } catch (err) {
    console.error(`notifications: failed to record ${field}`, err);
  }
}

let vapidConfigured = false;
let vapidWarned = false;

/**
 * Configure web-push once, and say so exactly once when it cannot be.
 *
 * The silent version of this was a genuine trap: the app happily accepted push
 * subscriptions and then dropped every send, with nothing anywhere saying why.
 */
export function vapidReady(): boolean {
  if (vapidConfigured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) {
    if (!vapidWarned) {
      vapidWarned = true;
      console.warn(
        "notifications: VAPID keys are not configured — web push is disabled. The in-app feed still works. Generate keys with `web-push generate-vapid-keys` and set VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY.",
      );
    }
    return false;
  }
  webpush.setVapidDetails(
    env.vapidSubject,
    env.vapidPublicKey,
    env.vapidPrivateKey,
  );
  vapidConfigured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  /**
   * Collapses repeats of the same notification type in the OS tray instead of
   * stacking five of them. Set to the catalogue key.
   */
  tag: string;
};

/** Best-effort OS push. Returns whether the push service accepted it. */
export async function pushTo(
  userId: string,
  subscription: unknown,
  payload: PushPayload,
): Promise<boolean> {
  if (!subscription) return false;
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload),
    );
    return true;
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;

    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired or was unsubscribed — drop it so we stop retrying.
      await db
        .update(users)
        .set({ pushSubscription: null })
        .where(eq(users.id, userId))
        .catch(() => {});
    } else {
      // Everything else is a real fault worth seeing: a 403 from a mismatched
      // VAPID pair looks exactly like "push doesn't work" from the outside, and
      // used to be discarded without a line in the log.
      console.error("notifications: web push failed", statusCode ?? "", err);
    }
    return false;
  }
}

/** Best-effort email. Returns whether it was handed to a transport. */
export async function emailTo(
  address: string | null | undefined,
  input: { title: string; body: string; url?: string },
): Promise<boolean> {
  const to = sendableAddress(address);
  if (!to) return false;

  const actionUrl = input.url?.startsWith("http")
    ? input.url
    : `${env.appUrl}${input.url ?? "/dashboard"}`;

  const { html, text } = notificationEmail({
    title: input.title,
    body: input.body,
    actionLabel: "Open Ikigai",
    actionUrl,
  });

  try {
    await sendMail({ to, subject: input.title, html, text });
    return true;
  } catch (err) {
    console.error("notifications: email failed", err);
    return false;
  }
}
