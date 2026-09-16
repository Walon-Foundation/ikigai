"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { eventAttendance, events } from "@/db/schema";
import {
  bool,
  imageUrl,
  lines,
  requiredText,
  slugify,
  text,
} from "@/lib/cms-admin";
import { cmsInvalidate } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";
import { announceEvent } from "@/lib/notifications/opportunities";

// Events are the one CMS entity backed by a table the app also uses. This is
// now the UNIFIED admin for events — previously split between the operational
// Events screen (capacity/type/attendance) and this CMS screen (image/tags/
// report). Merged so one route owns the whole `events` row plus its attendance.

const PATH = "/admin/cms/events";
const ATTENDANCE_STATUSES = ["registered", "attended", "no_show"] as const;

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

  const endsAt = parseDate(v.endsAt);
  if (endsAt && endsAt < startsAt) {
    throw new Error("End date must be after start date");
  }

  const fields = {
    title,
    startsAt,
    endsAt,
    location: text(v.location, 200),
    imageUrl: imageUrl(v.imageUrl, 500),
    // allowVolunteer / allowJoin default to true (checked by default in the form)
    allowVolunteer: bool(v.allowVolunteer),
    allowJoin: bool(v.allowJoin),
    reportSummary: text(v.reportSummary, 4_000),
    reportPartners: text(v.reportPartners, 500),
    reportImpact: text(v.reportImpact, 500),
    interestTags: lines(v.interestTags, 12, 60),
    slug: slugify(title),
  };

  let eventId = id;
  if (id) {
    await db.update(events).set(fields).where(eq(events.id, id));
  } else {
    // Created from the CMS → public by default; that is why the admin is here.
    const [row] = await db
      .insert(events)
      .values({ ...fields, isPublic: true, createdBy: admin.id })
      .returning({ id: events.id });
    eventId = row.id;
  }

  // Tell the mentees whose interests match. Deduped on the event, so editing
  // one afterwards — fixing a typo, adding the image — never re-announces it.
  if (eventId) {
    const announceId = eventId;
    after(async () => {
      await announceEvent(announceId);
    });
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

  // An event made public for the first time is the other way one becomes an
  // opportunity — the CMS create path is not the only route in, since the
  // operational Events admin creates internal events that are published later.
  if (next) {
    after(async () => {
      await announceEvent(id);
    });
  }

  cmsInvalidate(PATH);
}

export async function remove(id: string) {
  await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid event");
  await db.delete(eventAttendance).where(eq(eventAttendance.eventId, id));
  await db.delete(events).where(eq(events.id, id));
  cmsInvalidate(PATH);
  revalidatePath(PATH);
}

export async function setAttendanceStatus(data: {
  attendanceId: string;
  status: string;
}) {
  await requireAdmin();
  if (typeof data.attendanceId !== "string" || !data.attendanceId)
    throw new Error("Invalid attendance record");
  const status = (ATTENDANCE_STATUSES as readonly string[]).includes(
    data.status,
  )
    ? data.status
    : "registered";
  await db
    .update(eventAttendance)
    .set({ status })
    .where(eq(eventAttendance.id, data.attendanceId));
  cmsInvalidate(PATH);
  revalidatePath(PATH);
}
