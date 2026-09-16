import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// The in-app notification feed. The query itself — including the window
// function that makes the unread badge count every unread row rather than only
// the current page — now lives in the API's NotificationsModule, so the Expo
// app reads the same feed from the same implementation.
//
// This handler stays at /api/notifications rather than moving to /api/proxy so
// the header bell's polling URL is unchanged. It is the session boundary: this
// app still owns Clerk, resolves the user, and forwards the id.

export async function GET() {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await apiFetch<{ unread: number; items: unknown[] }>(
      "/notifications",
      { userId: me.id },
    );
    return NextResponse.json(data);
  } catch {
    // The bell polls this constantly on every page. A failure here must not
    // surface as a broken UI — an empty feed degrades quietly and the next
    // poll recovers.
    return NextResponse.json({ unread: 0, items: [] });
  }
}

// Body: { id } marks one read, {} marks all read.
export async function PATCH(request: Request) {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json().catch(() => ({ id: undefined }));

  await apiFetch<{ ok: true }>("/notifications", {
    method: "PATCH",
    userId: me.id,
    body: { id },
  });

  return NextResponse.json({ ok: true });
}
