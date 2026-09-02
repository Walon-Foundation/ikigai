"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { appCopy, notificationTemplates } from "@/db/schema";
import { bool, int, text } from "@/lib/cms-admin";
import { cmsInvalidate } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";
import { entryFor, isNotificationKey } from "@/lib/notifications/catalog";
import type { NotificationChannel } from "@/lib/notifications/categories";
import { DEFAULT_RULES, RULES_KEY } from "@/lib/notifications/templates";

const PATH = "/admin/notifications/templates";
const MAX_TITLE = 200;
const MAX_BODY = 1_000;
const CHANNELS: NotificationChannel[] = ["inapp", "push", "email"];

/**
 * Save one notification's copy and delivery settings.
 *
 * Clearing a field restores the copy shipped in lib/notifications/catalog.ts
 * rather than blanking the notification — which is why every column here is
 * nullable and why an empty string is written as NULL. There is no edit on this
 * screen that can produce an empty push.
 */
export async function saveTemplate(
  key: string,
  v: Record<string, string>,
): Promise<void> {
  await requireAdmin();
  if (!isNotificationKey(key)) throw new Error("Unknown notification");

  const entry = entryFor(key);

  // A title with no body (or the reverse) would render half a notification, so
  // either override both or neither.
  const title = text(v.title, MAX_TITLE);
  const body = text(v.body, MAX_BODY);
  if ((title && !body) || (body && !title)) {
    throw new Error(
      "Give both a title and a message, or clear both to use the default",
    );
  }

  const channels = CHANNELS.filter((c) => bool(v[`channel_${c}`]));
  if (channels.length === 0) {
    throw new Error(
      "Pick at least one channel, or switch the notification off instead",
    );
  }

  // The account category is what carries approvals and safeguarding alerts.
  // Those are not things a person may be prevented from receiving, so the
  // switch is refused here as well as ignored at send time — an admin should be
  // told why it will not turn off, not watch it save and quietly do nothing.
  const enabled = bool(v.enabled);
  if (!enabled && entry.category === "account") {
    throw new Error(
      "Safety and account notifications can't be switched off — they're how people find out about decisions affecting their account.",
    );
  }

  const priority = ["high", "medium", "low"].includes(v.priority)
    ? v.priority
    : entry.priority;

  const row = {
    title,
    body,
    enabled,
    channels,
    priority,
    // 0 means "no cooldown", which is different from "use the default", so it
    // is stored rather than treated as empty.
    cooldownHours: v.cooldownHours?.trim()
      ? int(v.cooldownHours, entry.cooldownHours ?? 0, 0, 8_760)
      : null,
    updatedAt: new Date(),
  };

  await db
    .insert(notificationTemplates)
    .values({ key, ...row })
    .onConflictDoUpdate({ target: notificationTemplates.key, set: row });

  cmsInvalidate(PATH);
}

/** Drop an override entirely, returning the notification to its shipped copy. */
export async function resetTemplate(key: string): Promise<void> {
  await requireAdmin();
  if (!isNotificationKey(key)) throw new Error("Unknown notification");
  await db
    .delete(notificationTemplates)
    .where(eq(notificationTemplates.key, key));
  cmsInvalidate(PATH);
}

/** The global timings the scheduled jobs read. */
export async function saveRules(v: Record<string, string>): Promise<void> {
  await requireAdmin();

  const value = {
    menteeInactiveDays: int(
      v.menteeInactiveDays,
      DEFAULT_RULES.menteeInactiveDays,
      1,
      365,
    ),
    menteeInactiveLongDays: int(
      v.menteeInactiveLongDays,
      DEFAULT_RULES.menteeInactiveLongDays,
      1,
      365,
    ),
    mentorNudgeDays: int(
      v.mentorNudgeDays,
      DEFAULT_RULES.mentorNudgeDays,
      1,
      365,
    ),
    mentorInactiveDays: int(
      v.mentorInactiveDays,
      DEFAULT_RULES.mentorInactiveDays,
      1,
      365,
    ),
    weeklySummaryWeekday: int(
      v.weeklySummaryWeekday,
      DEFAULT_RULES.weeklySummaryWeekday,
      0,
      6,
    ),
  };

  if (value.menteeInactiveLongDays <= value.menteeInactiveDays) {
    throw new Error(
      "The longer-absence reminder must come after the gentle one",
    );
  }

  await db
    .insert(appCopy)
    .values({ key: RULES_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appCopy.key,
      set: { value, updatedAt: new Date() },
    });

  cmsInvalidate(PATH);
}
