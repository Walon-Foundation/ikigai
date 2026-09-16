import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { isStorableSubscription } from "@/lib/notifications/subscription";

// Where the service worker sends a rotated push subscription.
//
// Browsers reissue a subscription on their own schedule — after a long idle
// period, a profile change, or a push-service migration. The old endpoint stops
// working immediately and starts returning 410, which prunes the stored row.
// Without a `pushsubscriptionchange` handler the user's push simply stopped
// one day, permanently, with the Settings toggle still showing "on" and no
// way to tell that anything had happened. Re-registering it is the fix.
//
// Authenticated on purpose: the alternative is matching on the old endpoint
// alone, which would let anyone who learned an endpoint repoint that user's
// notifications at their own device.
export async function POST(request: Request) {
  const me = await getDbUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await request.json().catch(() => null);
  if (!isStorableSubscription(subscription)) {
    return NextResponse.json(
      { error: "Invalid push subscription" },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ pushSubscription: subscription })
    .where(eq(users.id, me.id));

  return NextResponse.json({ ok: true });
}
