"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { events } from "@/db/schema";
import { requiredText, slugify, text } from "@/lib/cms-admin";
import { cmsInvalidate } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

// Events are the one CMS entity backed by a table the app also uses. So this
// action set is bespoke rather than the generic one:
//
//   - the publish flag is `isPublic`, not `published` — an event hidden from
//     the website may still be a live activity inside the app;
//   - there is no reordering (events order by date);
//   - deletion is intentionally NOT offered here. An event carries attendance
//     records, and removing it belongs on the operational /admin/events screen
//     that manages those, not on the marketing screen. Hiding (isPublic=false)
//     is the reversible action a content editor needs.

const PATH = "/admin/cms/events";

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function save(id: string | null, v: Record<string, string>) {
  const admin = await requireAdmin();
  const title = requiredText(v.title, 200, "Title");
  const startsAt = parseDate(v.startsAt);
  if (!startsAt) throw new Error("A valid start date and time is required");

  const fields = {
    title,
    startsAt,
    location: text(v.location, 200),
    imageUrl: text(v.imageUrl, 500),
    reportSummary: text(v.reportSummary, 4_000),
    reportPartners: text(v.reportPartners, 500),
    reportImpact: text(v.reportImpact, 500),
    slug: slugify(title),
  };

  if (id) {
    await db.update(events).set(fields).where(eq(events.id, id));
  } else {
    // Created from the CMS → public by default; that is why the admin is here.
    await db
      .insert(events)
      .values({ ...fields, isPublic: true, createdBy: admin.id });
  }
  cmsInvalidate(PATH);
}

export async function togglePublish(id: string, next: boolean) {
  await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid event");
  await db
    .update(events)
    .set({ isPublic: next === true })
    .where(eq(events.id, id));
  cmsInvalidate(PATH);
}

// The manager insists on a `remove`; deletion is disabled via canDelete so this
// is never reachable, but it must satisfy the type.
export async function remove(_id: string) {
  throw new Error("Delete events from the Events admin, not the CMS");
}
