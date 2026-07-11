import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { pushNotifications } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

// The in-app notification feed for the current user. Powers the header bell
// (unread count) and the /notifications page.
export async function GET() {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: pushNotifications.id,
      title: pushNotifications.title,
      body: pushNotifications.body,
      type: pushNotifications.type,
      url: pushNotifications.url,
      readAt: pushNotifications.readAt,
      sentAt: pushNotifications.sentAt,
    })
    .from(pushNotifications)
    .where(eq(pushNotifications.userId, me.id))
    .orderBy(desc(pushNotifications.sentAt))
    .limit(30);

  const unread = rows.filter((r) => !r.readAt).length;

  return NextResponse.json({
    unread,
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      type: r.type,
      url: r.url,
      read: !!r.readAt,
      timestamp: r.sentAt?.toISOString() ?? new Date().toISOString(),
    })),
  });
}

// Mark notifications read. Body: { id } for one, or {} to mark all read.
export async function PATCH(request: Request) {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json().catch(() => ({ id: undefined }));

  await db
    .update(pushNotifications)
    .set({ readAt: new Date() })
    .where(
      id
        ? and(
            eq(pushNotifications.userId, me.id),
            eq(pushNotifications.id, id),
            isNull(pushNotifications.readAt),
          )
        : and(
            eq(pushNotifications.userId, me.id),
            isNull(pushNotifications.readAt),
          ),
    );

  return NextResponse.json({ ok: true });
}
