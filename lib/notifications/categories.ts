// The vocabulary the notification system is built on: channels, priorities,
// categories, and the pure functions that decide what actually gets delivered.
//
// Deliberately import-free. Settings is a client component and needs
// CATEGORIES; the cron and every server action need the same values; the tests
// need resolveChannels() with no database. So nothing here may reach for
// `server-only`, the db, or env. The copy itself lives next door in catalog.ts
// — this file is only the shape.

export type NotificationChannel = "inapp" | "push" | "email";
export type NotificationPriority = "high" | "medium" | "low";

export type NotificationAudience =
  | "mentee"
  | "mentor"
  | "parent"
  | "admin"
  | "any";

/**
 * The coarse `push_notifications.type` column that predates this system. Every
 * catalogue entry still declares one so existing readers of that column keep
 * working; `key` is the precise identifier for anything new.
 */
export type LegacyNotifyType =
  | "nudge"
  | "match"
  | "milestone"
  | "broadcast"
  | "task"
  | "guardian";

export type NotificationCategory =
  | "progress"
  | "mentorship"
  | "messages"
  | "reminders"
  | "opportunities"
  | "community"
  | "summary"
  | "account";

export type CategoryMeta = {
  id: NotificationCategory;
  label: string;
  description: string;
  /**
   * Not shown in Settings and not opt-out-able. Approvals, rejections,
   * safeguarding alerts and admin broadcasts are things a person needs to
   * receive whether or not they would like to — muting them is not a
   * preference this product offers.
   */
  alwaysOn?: boolean;
};

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: "progress",
    label: "Milestones and progress",
    description: "When a milestone is unlocked, reviewed or a stage is reached",
  },
  {
    id: "mentorship",
    label: "Mentorship",
    description: "Requests, tasks, curriculum steps and check-ins",
  },
  {
    id: "messages",
    label: "Messages",
    description: "New messages in your conversation",
  },
  {
    id: "reminders",
    label: "Progress reminders",
    description: "Gentle nudges when your journey has been paused a while",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    description: "New programmes and events matching your interests",
  },
  {
    id: "community",
    label: "Community",
    description: "Activity in the clubs you belong to",
  },
  {
    id: "summary",
    label: "Weekly summary",
    description: "A short recap of your week",
  },
  {
    id: "account",
    label: "Account and safety",
    description: "Approvals, safety notices and important account updates",
    alwaysOn: true,
  },
];

/** The categories a user may actually switch off. */
export const SETTABLE_CATEGORIES = CATEGORIES.filter((c) => !c.alwaysOn);

/**
 * What `users.notificationPrefs` holds. Every field is optional and absence
 * means "on" — so a user who has never opened Settings receives everything, and
 * adding a category later needs no backfill.
 */
export type NotificationPrefs = {
  push?: boolean;
  email?: boolean;
  categories?: Partial<Record<NotificationCategory, boolean>>;
};

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

/**
 * Parse the jsonb column defensively. It is user-writable through a server
 * action, and rows predate the column, so anything at all may be in there —
 * an unreadable value must degrade to "everything on", never to silence.
 */
export function readPrefs(value: unknown): NotificationPrefs {
  if (typeof value !== "object" || value === null) return {};
  const raw = value as Record<string, unknown>;

  const categories: Partial<Record<NotificationCategory, boolean>> = {};
  if (typeof raw.categories === "object" && raw.categories !== null) {
    for (const [key, on] of Object.entries(
      raw.categories as Record<string, unknown>,
    )) {
      if (CATEGORY_IDS.has(key) && typeof on === "boolean") {
        categories[key as NotificationCategory] = on;
      }
    }
  }

  return {
    push: typeof raw.push === "boolean" ? raw.push : undefined,
    email: typeof raw.email === "boolean" ? raw.email : undefined,
    categories,
  };
}

/** Whether a category is switched on. Unset means on; alwaysOn ignores prefs. */
export function categoryEnabled(
  prefs: NotificationPrefs,
  category: NotificationCategory,
): boolean {
  if (isAlwaysOn(category)) return true;
  return prefs.categories?.[category] !== false;
}

export function isAlwaysOn(category: NotificationCategory): boolean {
  return CATEGORIES.some((c) => c.id === category && c.alwaysOn);
}

/**
 * Decide which channels a notification is actually delivered on.
 *
 * The three rules, in order of authority:
 *
 *   1. An `account` notification always uses every channel it declares. This
 *      is what stops a mentee muting the response to their own safety report.
 *   2. A switched-off category delivers nothing at all — not even the in-app
 *      row, because a feed entry the user asked not to receive is still a
 *      notification.
 *   3. Low priority never pushes. General reminders, weekly summaries and
 *      community chatter land in the app and wait to be found; only things a
 *      person needs to know now are allowed to interrupt them. This single
 *      rule is most of the difference between a nudge and an advert.
 */
export function resolveChannels(input: {
  channels: readonly NotificationChannel[];
  category: NotificationCategory;
  priority: NotificationPriority;
  prefs: NotificationPrefs;
}): NotificationChannel[] {
  const { channels, category, priority, prefs } = input;

  if (isAlwaysOn(category)) return [...channels];
  if (!categoryEnabled(prefs, category)) return [];

  return channels.filter((channel) => {
    if (channel === "push") return prefs.push !== false && priority !== "low";
    if (channel === "email") return prefs.email !== false;
    return true;
  });
}

/**
 * Fill `{{placeholder}}` slots from vars.
 *
 * An unknown or empty placeholder is left standing rather than replaced with
 * an empty string: "{{mentee}} completed a milestone" reads as a bug and gets
 * fixed, where " completed a milestone" reads as a sentence and ships.
 */
export function render(template: string, vars: NotifyVars = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => {
    const value = vars[key];
    return typeof value === "string" && value.length > 0 ? value : whole;
  });
}

export type NotifyVars = Record<string, string | undefined>;
