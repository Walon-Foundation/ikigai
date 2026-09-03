"use server";

import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { dispatchMany } from "@/lib/notifications/dispatch";

const MAX_TITLE = 200;
const MAX_BODY = 1_000;
const MAX_URL = 300;

const AUDIENCES = [
  "all",
  "mentees",
  "mentors",
  "parents",
  "club_leads",
] as const;
type Audience = (typeof AUDIENCES)[number];

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Everyone the broadcast should reach, with the push subscription, email and
// notification preferences already loaded so the fan-out costs a fixed number
// of round-trips rather than four per recipient.
async function recipientsFor(audience: Audience) {
  const select = {
    id: users.id,
    email: users.email,
    subscription: users.pushSubscription,
    prefs: users.notificationPrefs,
  };

  if (audience === "club_leads") {
    // Club leads aren't a role — they're whoever is named as a school's lead.
    // The old stub had a hardcoded count for this audience and no filter behind
    // it anywhere on the server.
    //
    // Don't use SELECT DISTINCT over jsonb columns (pushSubscription,
    // notificationPrefs) — Postgres can compare jsonb but Neon-http + Drizzle
    // distinct over jsonb is fragile and a user leading two verified schools
    // would appear twice. De-duplicate by id in JS instead.
    const rows = await db
      .select(select)
      .from(users)
      .innerJoin(schools, eq(schools.clubLeadId, users.id))
      .where(and(isNotNull(schools.verifiedAt), isNull(users.deletedAt)));
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  if (
    audience === "mentees" ||
    audience === "mentors" ||
    audience === "parents"
  ) {
    const role =
      audience === "mentees"
        ? "mentee"
        : audience === "mentors"
          ? "mentor"
          : "parent";
    return db
      .select(select)
      .from(users)
      .where(and(eq(users.role, role), isNull(users.deletedAt)));
  }

  // "all" means everyone who can actually receive it — admins included, since
  // they're users too, but not rows with no role at all.
  return db
    .select(select)
    .from(users)
    .where(
      and(
        inArray(users.role, ["mentee", "mentor", "parent", "admin"]),
        // Purged accounts are tombstones, not people. They keep their row so
        // safety reports still point somewhere; they must not be broadcast to.
        isNull(users.deletedAt),
      ),
    );
}

/**
 * Send an admin broadcast for real.
 *
 * What this replaces: the client's handleSend() set a "Sent! ✓" flag, cleared
 * the form, and never called anything. The API it was supposed to call was
 * itself a stub that returned hardcoded counts ({ all: 523, mentees: 398, … })
 * without touching the database. An admin composed a message, watched it
 * confirm, and not one person received it. The tell was sitting right there on
 * the same screen: the "Sent History" panel reads push_notifications for real,
 * so the message they'd just "sent" never appeared in it.
 *
 * Reports what actually happened per channel. The previous version returned
 * the number of feed rows written and the screen rendered it as "Sent to N
 * people" — which counted people who will see it next time they open the app,
 * not people whose phone lit up. Those are different numbers and an admin
 * deciding whether a message landed needs both.
 */
export async function sendBroadcast(data: {
  title: string;
  body: string;
  audience: string;
  url?: string;
}): Promise<{ persisted: number; pushed: number; skipped: number }> {
  await requireAdmin();

  const title = str(data.title, MAX_TITLE);
  const body = str(data.body, MAX_BODY);
  if (!title) throw new Error("Title is required");
  if (!body) throw new Error("Message is required");

  // Where tapping the notification takes them. Must be a path on the PWA, not
  // an absolute URL: an admin-supplied "https://..." here would send every user
  // on the platform to somewhere off-product in one click.
  const rawUrl = str(data.url, MAX_URL);
  if (rawUrl && !rawUrl.startsWith("/")) {
    throw new Error("Link must be an in-app path starting with /");
  }

  const audience = (AUDIENCES as readonly string[]).includes(data.audience)
    ? (data.audience as Audience)
    : "all";

  const recipients = await recipientsFor(audience);
  const result = await dispatchMany(recipients, {
    key: "BROADCAST",
    vars: { title, body },
    url: rawUrl || undefined,
    // Groups this fan-out so the history can show one broadcast rather than
    // one row per recipient.
    broadcastId: crypto.randomUUID(),
  });

  // The history panel on this page reads straight from push_notifications.
  revalidatePath("/admin/notifications");

  return {
    persisted: result.persisted,
    pushed: result.pushed,
    skipped: result.skipped,
  };
}
