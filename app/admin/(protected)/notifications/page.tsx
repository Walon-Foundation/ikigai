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
  const history = await db
    .select({
      broadcastId: pushNotifications.broadcastId,
      title: sql<string>`min(${pushNotifications.title})`,
      body: sql<string>`min(${pushNotifications.body})`,
      sentAt: sql<Date>`min(${pushNotifications.sentAt})`,
      recipients: count(),
      pushed: sql<number>`count(${pushNotifications.pushedAt})`,
      opened: sql<number>`count(${pushNotifications.readAt})`,
    })
    .from(pushNotifications)
    .where(isNotNull(pushNotifications.broadcastId))
    .groupBy(pushNotifications.broadcastId)
    .orderBy(desc(sql`min(${pushNotifications.sentAt})`))
    .limit(20);

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
        history={history.map((h) => ({
          id: h.broadcastId ?? "",
          title: h.title,
          body: h.body,
          sentAt: h.sentAt ? new Date(h.sentAt) : null,
          recipients: Number(h.recipients),
          pushed: Number(h.pushed),
          opened: Number(h.opened),
        }))}
      />
    </div>
  );
}
