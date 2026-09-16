import Link from "next/link";
import { db } from "@/db/db";
import { notificationTemplates } from "@/db/schema";
import {
  entryFor,
  NOTIFICATION_KEYS,
  type NotificationKey,
} from "@/lib/notifications/catalog";
import { CATEGORIES, isAlwaysOn } from "@/lib/notifications/categories";
import { DEFAULT_RULES, getRules } from "@/lib/notifications/templates";
import {
  RulesEditor,
  TemplateEditor,
  type TemplateRow,
} from "./templates-client";

// Every notification the platform can send, and what it says.
//
// The list is driven by lib/notifications/catalog.ts, not by the table — so a
// notification cannot exist without appearing here, and a row for a key that no
// longer exists simply stops being shown. Editing is optional: with an empty
// table every notification still sends its shipped copy.

export default async function NotificationTemplatesPage() {
  const [overrides, rules] = await Promise.all([
    db.select().from(notificationTemplates),
    getRules(),
  ]);
  const byKey = new Map(overrides.map((row) => [row.key, row]));

  const rows: TemplateRow[] = NOTIFICATION_KEYS.map((key: NotificationKey) => {
    const entry = entryFor(key);
    const override = byKey.get(key);
    return {
      key,
      category: entry.category,
      audience: entry.audience,
      alwaysOn: isAlwaysOn(entry.category),
      defaultTitle: entry.title,
      defaultBody: entry.body,
      defaultCooldown: entry.cooldownHours ?? null,
      title: override?.title ?? "",
      body: override?.body ?? "",
      enabled: override?.enabled ?? true,
      channels: override?.channels ?? [...entry.channels],
      priority: override?.priority ?? entry.priority,
      cooldownHours:
        override?.cooldownHours === null ||
        override?.cooldownHours === undefined
          ? ""
          : String(override.cooldownHours),
      overridden: !!override,
    };
  });

  // Grouped by the switch a user sees in their own settings, so an admin
  // editing "Milestones and progress" is looking at exactly what a mentee can
  // turn off under that name.
  const grouped = CATEGORIES.map((category) => ({
    category,
    rows: rows.filter((r) => r.category === category.id),
  })).filter((g) => g.rows.length > 0);

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-2xl font-black text-foreground">
          Notification templates
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The wording, channels and frequency of every automatic notification.
          Changes take effect immediately — no deploy.{" "}
          <Link
            href="/admin/notifications"
            className="text-primary underline-offset-4 hover:underline"
          >
            Send a one-off broadcast instead
          </Link>
          .
        </p>
      </div>

      <div className="mb-8">
        <RulesEditor
          values={{
            menteeInactiveDays: String(rules.menteeInactiveDays),
            menteeInactiveLongDays: String(rules.menteeInactiveLongDays),
            mentorNudgeDays: String(rules.mentorNudgeDays),
            mentorInactiveDays: String(rules.mentorInactiveDays),
            weeklySummaryWeekday: String(
              rules.weeklySummaryWeekday ?? DEFAULT_RULES.weeklySummaryWeekday,
            ),
          }}
        />
      </div>

      <div className="space-y-10">
        {grouped.map(({ category, rows: group }) => (
          <section key={category.id}>
            <div className="mb-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {category.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {category.alwaysOn
                  ? "Always delivered — people can't switch these off."
                  : category.description}
              </p>
            </div>
            <div className="space-y-4">
              {group.map((row) => (
                <TemplateEditor key={row.key} row={row} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
