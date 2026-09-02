import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/db";
import { appCopy, notificationTemplates } from "@/db/schema";
import { entryFor, type NotificationKey } from "./catalog";
import type { NotificationChannel, NotificationPriority } from "./categories";

// Merges the admin's overrides (notification_templates) onto the defaults
// shipped in catalog.ts.
//
// Every override column is nullable and null means "use the code default", so
// clearing a field in the admin form restores the shipped copy rather than
// blanking the notification. That is the property that makes the table safe to
// hand to a non-engineer: there is no edit that can produce an empty push.

export type ResolvedTemplate = {
  enabled: boolean;
  title: string;
  body: string;
  channels: readonly NotificationChannel[];
  priority: NotificationPriority;
  cooldownHours: number | null;
};

const VALID_CHANNELS = new Set<string>(["inapp", "push", "email"]);
const VALID_PRIORITIES = new Set<string>(["high", "medium", "low"]);

type OverrideRow = typeof notificationTemplates.$inferSelect;

/**
 * Every override in one query, memoised for the request.
 *
 * All of them, not just the key being sent: the table holds one row per
 * notification type — a few dozen at most, forever — and over Neon's HTTP
 * driver one round-trip for the lot beats one per dispatch. A broadcast
 * dispatching to hundreds of people reads this exactly once.
 */
const loadOverrides = cache(async (): Promise<Map<string, OverrideRow>> => {
  try {
    const rows = await db.select().from(notificationTemplates);
    return new Map(rows.map((row) => [row.key, row]));
  } catch (err) {
    // A missing table or an unreachable database must not stop a notification:
    // the catalogue alone is a complete, working configuration.
    console.error("notifications: could not load template overrides", err);
    return new Map();
  }
});

export async function resolveTemplate(
  key: NotificationKey,
): Promise<ResolvedTemplate> {
  const entry = entryFor(key);
  const override = (await loadOverrides()).get(key);

  const channels = override?.channels?.filter((c) => VALID_CHANNELS.has(c)) as
    | NotificationChannel[]
    | undefined;

  const priority =
    override?.priority && VALID_PRIORITIES.has(override.priority)
      ? (override.priority as NotificationPriority)
      : entry.priority;

  return {
    enabled: override?.enabled ?? true,
    title: override?.title ?? entry.title,
    body: override?.body ?? entry.body,
    channels: channels && channels.length > 0 ? channels : entry.channels,
    priority,
    cooldownHours: override?.cooldownHours ?? entry.cooldownHours ?? null,
  };
}

// ---------------------------------------------------------------------------
// Global scheduling rules
//
// The per-type knobs live on the template row; these are the handful that
// aren't per-type. Stored in app_copy — the existing key/jsonb settings store —
// rather than in a table of their own, because five numbers do not need one.
// ---------------------------------------------------------------------------

export type NotificationRules = {
  /** Days of mentee silence before the first gentle nudge. */
  menteeInactiveDays: number;
  /** Days before the softer, longer-absence message instead. */
  menteeInactiveLongDays: number;
  /** Days without mentor contact before the mentor is prompted to check in. */
  mentorNudgeDays: number;
  /** Days of mentee silence before the MENTOR is told. */
  mentorInactiveDays: number;
  /** Weekday the summaries go out, 0 = Sunday. */
  weeklySummaryWeekday: number;
};

export const DEFAULT_RULES: NotificationRules = {
  menteeInactiveDays: 4,
  menteeInactiveLongDays: 14,
  mentorNudgeDays: 7,
  mentorInactiveDays: 14,
  weeklySummaryWeekday: 0,
};

export const RULES_KEY = "notification_rules";

function ruleNumber(raw: unknown, fallback: number, max: number): number {
  const n = typeof raw === "number" ? raw : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(0, Math.round(n)));
}

export const getRules = cache(async (): Promise<NotificationRules> => {
  try {
    const [row] = await db
      .select({ value: appCopy.value })
      .from(appCopy)
      .where(eq(appCopy.key, RULES_KEY))
      .limit(1);
    const v = (row?.value ?? {}) as Record<string, unknown>;
    return {
      menteeInactiveDays: ruleNumber(
        v.menteeInactiveDays,
        DEFAULT_RULES.menteeInactiveDays,
        365,
      ),
      menteeInactiveLongDays: ruleNumber(
        v.menteeInactiveLongDays,
        DEFAULT_RULES.menteeInactiveLongDays,
        365,
      ),
      mentorNudgeDays: ruleNumber(
        v.mentorNudgeDays,
        DEFAULT_RULES.mentorNudgeDays,
        365,
      ),
      mentorInactiveDays: ruleNumber(
        v.mentorInactiveDays,
        DEFAULT_RULES.mentorInactiveDays,
        365,
      ),
      weeklySummaryWeekday: ruleNumber(
        v.weeklySummaryWeekday,
        DEFAULT_RULES.weeklySummaryWeekday,
        6,
      ),
    };
  } catch (err) {
    console.error("notifications: could not load rules", err);
    return DEFAULT_RULES;
  }
});
