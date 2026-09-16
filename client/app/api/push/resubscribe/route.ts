import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// Where the service worker sends a rotated push subscription.
//
// Browsers reissue a subscription on their own schedule — after a long idle
// period, a profile change, or a push-service migration. The old endpoint stops
// working immediately and starts returning 410, which prunes the stored row.
// Without a `pushsubscriptionchange` handler the user's push simply stopped one
// day, permanently, with the Settings toggle still showing "on" and no way to
// tell that anything had happened.
//
// Authenticated on purpose: the alternative is matching on the old endpoint
// alone, which would let anyone who learned an endpoint repoint that user's
// notifications at their own device. Validation of the subscription shape now
// happens in the API, which is also where mobile will register its tokens.
export async function POST(request: Request) {
  const me = await getDbUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await request.json().catch(() => null);

  try {
    await apiFetch<{ ok: true }>("/notifications/push-subscription", {
      method: "POST",
      userId: me.id,
      body: subscription,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid subscription",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
