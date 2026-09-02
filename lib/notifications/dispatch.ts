import "server-only";
import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import { pushNotifications, users } from "@/db/schema";
import { env } from "@/lib/env";
import { entryFor, type NotificationKey, resolveUrl } from "./catalog";
import {
  type NotificationChannel,
  type NotifyVars,
  readPrefs,
  render,
  resolveChannels,
} from "./categories";
import { resolveTemplate } from "./templates";
import {
  emailTo,
  type FeedRow,
  insertFeedRows,
  markDelivered,
  pushTo,
  vapidReady,
} from "./transport";

// The single entry point for sending anything.
//
//   await dispatch({ key: "MILESTONE_UNLOCKED", to: menteeId,
//                    vars: { skill: "Public Speaking" },
//                    dedupe: milestoneId });
//
// Everything else — which channels, whether the user wants it, whether it was
// already sent, what the deep link is, what the copy says — is decided here
// from the catalogue and the admin's overrides. Callers pass the event and the
// people; they do not pass copy, channels or URLs.
//
// Nothing in this file throws. A notification that cannot be delivered must not
// take down the action that triggered it: accepting a mentorship request has to
// succeed even if the push service is having a bad day.

export type Recipient = {
  id: string;
  /** users.pushSubscription */
  subscription?: unknown;
  email?: string | null;
  /** users.notificationPrefs */
  prefs?: unknown;
};

export type DispatchInput = {
  key: NotificationKey;
  vars?: NotifyVars;
  /** Overrides the catalogue's deep link. Rarely needed. */
  url?: string;
  /**
   * Stable identifier for the thing being notified about — a milestone id, a
   * task id, a week number. Turns the send into an idempotent one: the same
   * event dispatched twice writes one row, refused by a unique index rather
   * than by remembering to check first.
   */
  dedupe?: string;
  /** Set by the admin broadcast so its fan-out can be grouped in history. */
  broadcastId?: string;
};

export type DispatchResult = {
  /** Feed rows written — the channel that always works. */
  persisted: number;
  /** Pushes the push service accepted. Never more than `persisted`. */
  pushed: number;
  /** Emails handed to a transport. */
  emailed: number;
  /** Recipients dropped by preference, priority, cooldown or dedupe. */
  skipped: number;
};

const EMPTY: DispatchResult = {
  persisted: 0,
  pushed: 0,
  emailed: 0,
  skipped: 0,
};

/** `${userId}:${key}:${suffix}` — unique per person, event and subject. */
export function dedupeKeyFor(
  userId: string,
  key: NotificationKey,
  suffix: string,
): string {
  return `${userId}:${key}:${suffix}`;
}

/** Send to one user, loading everything the decision needs in one query. */
export async function dispatch(
  input: DispatchInput & { to: string },
): Promise<DispatchResult> {
  try {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        subscription: users.pushSubscription,
        prefs: users.notificationPrefs,
      })
      .from(users)
      .where(and(eq(users.id, input.to), isNull(users.deletedAt)))
      .limit(1);

    if (!row) return EMPTY;
    return await dispatchMany([row], input);
  } catch (err) {
    console.error(`notifications: dispatch(${input.key}) failed`, err);
    return EMPTY;
  }
}

/** Send to every admin — safeguarding alerts and nothing else, so far. */
export async function dispatchToAdmins(
  input: DispatchInput,
): Promise<DispatchResult> {
  try {
    const admins = await db
      .select({
        id: users.id,
        email: users.email,
        subscription: users.pushSubscription,
        prefs: users.notificationPrefs,
      })
      .from(users)
      .where(and(eq(users.role, "admin"), isNull(users.deletedAt)));

    return await dispatchMany(admins, input);
  } catch (err) {
    console.error(`notifications: dispatchToAdmins(${input.key}) failed`, err);
    return EMPTY;
  }
}

/**
 * Send the same notification to many people.
 *
 * Deliberately not a loop over dispatch(): that costs a handful of network
 * round-trips per recipient, and over the neon-http driver a broadcast to the
 * whole platform would take minutes. The caller passes recipients it has
 * already loaded, preference and cooldown filtering happens in memory, feed
 * rows go in as a few bulk inserts, and the pushes — which go to FCM, not to us
 * — are fired concurrently.
 *
 * The copy is rendered once, so every recipient gets the same words. Anything
 * personalised ("{{mentee}} completed...") belongs in dispatch(), one per user.
 */
export async function dispatchMany(
  recipients: Recipient[],
  input: DispatchInput,
): Promise<DispatchResult> {
  if (recipients.length === 0) return EMPTY;

  try {
    const entry = entryFor(input.key);
    const template = await resolveTemplate(input.key);

    // An admin can switch a notification type off platform-wide — except in the
    // `account` category, where the whole point is that it always arrives.
    if (!template.enabled && entry.category !== "account") {
      return { ...EMPTY, skipped: recipients.length };
    }

    const vars = input.vars ?? {};
    const title = render(template.title, vars);
    const body = render(template.body, vars);
    const url = adminAware(
      input.url ?? resolveUrl(entry.url, vars),
      entry.audience,
    );

    const blocked = await recentlyNotified(
      recipients.map((r) => r.id),
      input.key,
      template.cooldownHours,
    );

    const rows: FeedRow[] = [];
    const byUser = new Map<
      string,
      { recipient: Recipient; channels: NotificationChannel[] }
    >();
    let skipped = 0;

    for (const recipient of recipients) {
      if (blocked.has(recipient.id)) {
        skipped++;
        continue;
      }

      const channels = resolveChannels({
        channels: template.channels,
        category: entry.category,
        priority: template.priority,
        prefs: readPrefs(recipient.prefs),
      });

      if (channels.length === 0) {
        skipped++;
        continue;
      }

      byUser.set(recipient.id, { recipient, channels });
      rows.push({
        userId: recipient.id,
        title,
        body,
        type: entry.legacyType,
        key: input.key,
        category: entry.category,
        priority: template.priority,
        channels,
        url,
        dedupeKey: input.dedupe
          ? dedupeKeyFor(recipient.id, input.key, input.dedupe)
          : null,
        broadcastId: input.broadcastId ?? null,
      });
    }

    if (rows.length === 0) return { ...EMPTY, skipped };

    const inserted = await insertFeedRows(rows);
    // Anything the unique index refused was already sent. That is a skip, not
    // a failure — it is the no-duplicates rule doing its job.
    skipped += rows.length - inserted.length;

    const pushable = vapidReady();
    const pushedIds: string[] = [];
    const emailedIds: string[] = [];

    await Promise.allSettled(
      inserted.map(async ({ id, userId }) => {
        if (!userId) return;
        const target = byUser.get(userId);
        if (!target) return;
        const { recipient, channels } = target;

        if (pushable && channels.includes("push") && recipient.subscription) {
          const ok = await pushTo(userId, recipient.subscription, {
            title,
            body,
            url,
            // Collapses repeats of the same type in the tray rather than
            // stacking five identical notifications.
            tag: input.key,
          });
          if (ok) pushedIds.push(id);
        }

        if (channels.includes("email") && recipient.email) {
          const ok = await emailTo(recipient.email, { title, body, url });
          if (ok) emailedIds.push(id);
        }
      }),
    );

    await Promise.allSettled([
      markDelivered(pushedIds, "pushedAt"),
      markDelivered(emailedIds, "emailedAt"),
    ]);

    return {
      persisted: inserted.length,
      pushed: pushedIds.length,
      emailed: emailedIds.length,
      skipped,
    };
  } catch (err) {
    console.error(`notifications: dispatchMany(${input.key}) failed`, err);
    return EMPTY;
  }
}

/**
 * Admin-facing notifications point at the admin panel, which is a different
 * origin from the PWA that renders the feed and runs the service worker. A bare
 * "/reports/123" there would open a PWA route that does not exist.
 */
function adminAware(url: string, audience: string): string {
  if (audience !== "admin") return url;
  if (!url.startsWith("/")) return url;
  return `${env.adminUrl}${url}`;
}

/**
 * Which of these users already had this notification inside the cooldown.
 *
 * One query for the whole set rather than one per person, so a fan-out stays a
 * fixed number of round-trips. Returns empty when the key has no cooldown,
 * without touching the database at all.
 */
async function recentlyNotified(
  userIds: string[],
  key: NotificationKey,
  cooldownHours: number | null,
): Promise<Set<string>> {
  if (!cooldownHours || cooldownHours <= 0 || userIds.length === 0) {
    return new Set();
  }

  const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

  try {
    const rows = await db
      .select({ userId: pushNotifications.userId })
      .from(pushNotifications)
      .where(
        and(
          eq(pushNotifications.key, key),
          gte(pushNotifications.sentAt, since),
          inArray(pushNotifications.userId, userIds),
        ),
      );
    return new Set(
      rows.map((r) => r.userId).filter((id): id is string => !!id),
    );
  } catch (err) {
    // Failing open is right here: a missed cooldown sends one notification too
    // many, where failing closed would silently stop sending altogether.
    console.error("notifications: cooldown check failed", err);
    return new Set();
  }
}
