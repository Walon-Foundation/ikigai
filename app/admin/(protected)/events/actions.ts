"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { eventAttendance, events } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";

const MAX_TITLE = 200;
const MAX_DESC = 2_000;
const MAX_LOCATION = 200;
const REGIONS = ["freetown", "western_rural"] as const;
const EVENT_TYPES = [
  "workshop",
  "training",
  "networking",
  "wellness",
  "camp",
  "picnic",
] as const;
const ATTENDANCE_STATUSES = ["registered", "attended", "no_show"] as const;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function createEvent(data: {
  title: string;
  description?: string;
  location?: string;
  region?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: string;
  type?: string;
  unlockAtPercent?: string;
}) {
  const admin = await requireAdmin();

  const title = str(data.title, MAX_TITLE);
  if (!title) throw new Error("Title is required");

  const startsAt = data.startsAt ? new Date(data.startsAt) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    throw new Error("A valid start date/time is required");
  }

  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  const region = (REGIONS as readonly string[]).includes(data.region ?? "")
    ? (data.region as string)
    : null;
  const type = (EVENT_TYPES as readonly string[]).includes(data.type ?? "")
    ? (data.type as string)
    : "workshop";
  const capacityNum = data.capacity ? Number.parseInt(data.capacity, 10) : NaN;
  const capacity =
    Number.isFinite(capacityNum) && capacityNum > 0 ? capacityNum : null;
  const unlockNum = data.unlockAtPercent
    ? Number.parseInt(data.unlockAtPercent, 10)
    : NaN;
  const unlockAtPercent =
    Number.isFinite(unlockNum) && unlockNum > 0 ? Math.min(100, unlockNum) : 0;

  await db.insert(events).values({
    title,
    description: str(data.description, MAX_DESC) || null,
    location: str(data.location, MAX_LOCATION) || null,
    region,
    type,
    unlockAtPercent,
    startsAt,
    endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
    capacity,
    createdBy: admin.id,
  });

  revalidatePath("/admin/events");
}

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  if (typeof eventId !== "string" || !eventId) throw new Error("Invalid event");

  // Remove attendance rows first to satisfy the foreign key.
  await db.delete(eventAttendance).where(eq(eventAttendance.eventId, eventId));
  await db.delete(events).where(eq(events.id, eventId));

  revalidatePath("/admin/events");
}

export async function setAttendanceStatus(data: {
  attendanceId: string;
  status: string;
}) {
  await requireAdmin();
  if (typeof data.attendanceId !== "string" || !data.attendanceId) {
    throw new Error("Invalid attendance record");
  }
  const status = (ATTENDANCE_STATUSES as readonly string[]).includes(
    data.status,
  )
    ? data.status
    : "registered";

  await db
    .update(eventAttendance)
    .set({ status })
    .where(eq(eventAttendance.id, data.attendanceId));

  revalidatePath("/admin/events");
}
