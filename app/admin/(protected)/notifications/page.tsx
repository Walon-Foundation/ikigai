import { count, desc, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db/db";
import { pushNotifications } from "@/db/schema";
import { NotificationsClient } from "./notifications-client";

export default async function AdminNotificationsPage() {
  // Grouped by broadcast, not one row per recipient.
  //
  // The fan-out writes a row per person, so the previous "20 most recent rows"
  // showed a single broadcast to 500 people as 500 identical entries and hid
  // every message sent before it. Grouping also gives the numbers that matter
  // after the fact: how many it reached, how many phones lit up, how many
  // people have actually opened it.
  let history: {
    broadcastId: string | null;
    title: string;
    body: string;
    sentAt: string | Date | null;
    recipients: number | string;
    pushed: number | string;
    opened: number | string;
  }[] = [];
  try {
    history = await db
      .select({
        broadcastId: pushNotifications.broadcastId,
        title: sql<string>`min(${pushNotifications.title})`,
        body: sql<string>`min(${pushNotifications.body})`,
        sentAt: sql<string>`min(${pushNotifications.sentAt})`,
        recipients: count(),
        pushed: sql<string>`count(${pushNotifications.pushedAt})`,
        opened: sql<string>`count(${pushNotifications.readAt})`,
      })
      .from(pushNotifications)
      .where(isNotNull(pushNotifications.broadcastId))
      .groupBy(pushNotifications.broadcastId)
      .orderBy(desc(sql`min(${pushNotifications.sentAt})`))
      .limit(20);
  } catch (err) {
    console.error("admin/notifications: history query failed", err);
    history = [];
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Push Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a one-off message to a group of people.{" "}
          <Link
            href="/admin/notifications/templates"
            className="text-primary underline-offset-4 hover:underline"
          >
            Edit the automatic notifications
          </Link>{" "}
          — milestones, reminders, weekly summaries — instead.
        </p>
      </div>
      <NotificationsClient
        history={history.map((h) => {
          // Neon returns timestamp as "2026-09-03 14:59:07.837174" (no T, no Z).
          // new Date("2026-09-03 14:59:07") is parsed as local time in V8 but
          // can be Invalid Date in other runtimes — normalize to ISO first.
          let sentAt: Date | null = null;
          if (h.sentAt) {
            const raw = String(h.sentAt).trim();
            const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
            // If no timezone suffix, treat as UTC (Neon stores UTC).
            const withTz = /[Z+-]/.test(iso) ? iso : `${iso}Z`;
            const d = new Date(withTz);
            sentAt = Number.isNaN(d.getTime()) ? null : d;
          }
          return {
            id: h.broadcastId ?? "",
            title: h.title ?? "",
            body: h.body ?? "",
            sentAt,
            recipients: Number(h.recipients ?? 0),
            pushed: Number(h.pushed ?? 0),
            opened: Number(h.opened ?? 0),
          };
        })}
      />
    </div>
  );
}
