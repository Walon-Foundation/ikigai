"use server";

import { eq, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { notifyMany } from "@/lib/notify";

const MAX_TITLE = 200;
const MAX_BODY = 1_000;

export const AUDIENCES = ["all", "mentees", "mentors", "club_leads"] as const;
export type Audience = (typeof AUDIENCES)[number];

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Everyone the broadcast should reach, with their push subscription already
// loaded so notifyMany doesn't have to look each one up individually.
async function recipientsFor(audience: Audience) {
  const select = {
    id: users.id,
    subscription: users.pushSubscription,
  };

  if (audience === "club_leads") {
    // Club leads aren't a role — they're whoever is named as a school's lead.
    // The old stub had a hardcoded count for this audience and no filter behind
    // it anywhere on the server.
    return db
      .selectDistinct(select)
      .from(users)
      .innerJoin(schools, eq(schools.clubLeadId, users.id))
      .where(isNotNull(schools.verifiedAt));
  }

  if (audience === "mentees" || audience === "mentors") {
    const role = audience === "mentees" ? "mentee" : "mentor";
    return db.select(select).from(users).where(eq(users.role, role));
  }

  // "all" means everyone who can actually receive it — admins included, since
  // they're users too, but not rows with no role at all.
  return db
    .select(select)
    .from(users)
    .where(inArray(users.role, ["mentee", "mentor", "parent", "admin"]));
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
 * Returns how many users it reached so the UI can report a true number.
 */
export async function sendBroadcast(data: {
  title: string;
  body: string;
  audience: string;
}): Promise<{ sent: number }> {
  await requireAdmin();

  const title = str(data.title, MAX_TITLE);
  const body = str(data.body, MAX_BODY);
  if (!title) throw new Error("Title is required");
  if (!body) throw new Error("Message is required");

  const audience = (AUDIENCES as readonly string[]).includes(data.audience)
    ? (data.audience as Audience)
    : "all";

  const recipients = await recipientsFor(audience);
  const sent = await notifyMany(recipients, {
    title,
    body,
    type: "broadcast",
    url: "/dashboard",
  });

  // The history panel on this page reads straight from push_notifications.
  revalidatePath("/admin/notifications");

  return { sent };
}
