import { desc } from "drizzle-orm";
import { db } from "@/db/db";
import { pushNotifications } from "@/db/schema";
import { NotificationsClient } from "./notifications-client";

export default async function AdminNotificationsPage() {
  const history = await db
    .select()
    .from(pushNotifications)
    .orderBy(desc(pushNotifications.sentAt))
    .limit(20);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Push Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compose and send notifications to users
        </p>
      </div>
      <NotificationsClient history={history} />
    </div>
  );
}
