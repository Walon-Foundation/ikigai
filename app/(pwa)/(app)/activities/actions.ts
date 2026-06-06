"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { eventAttendance, events } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { getMenteeProgress } from "@/lib/progress";

async function loadEvent(eventId: string) {
  if (typeof eventId !== "string" || !eventId) throw new Error("Invalid event");
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) throw new Error("Event not found");
  return event;
}

// Register / RSVP for an event. Enforces capacity and the roadmap-completion
// unlock gate (e.g. the Finding Yourself Picnic unlocks at 50% for mentees).
export async function rsvp(eventId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  const event = await loadEvent(eventId);

  // Unlock gate applies to mentees (mentors aren't on the roadmap).
  if (me.role === "mentee" && (event.unlockAtPercent ?? 0) > 0) {
    const progress = await getMenteeProgress(me);
    if (progress.percent < (event.unlockAtPercent ?? 0)) {
      throw new Error(
        `Reach ${event.unlockAtPercent}% roadmap completion to unlock this event`,
      );
    }
  }

  // Already registered? Idempotent.
  const [existing] = await db
    .select({ id: eventAttendance.id })
    .from(eventAttendance)
    .where(
      and(
        eq(eventAttendance.eventId, eventId),
        eq(eventAttendance.userId, me.id),
      ),
    )
    .limit(1);
  if (existing) return;

  // Capacity check.
  if (event.capacity != null) {
    const [{ taken }] = await db
      .select({ taken: count() })
      .from(eventAttendance)
      .where(eq(eventAttendance.eventId, eventId));
    if (Number(taken) >= event.capacity) throw new Error("Event is full");
  }

  await db
    .insert(eventAttendance)
    .values({
      eventId,
      userId: me.id,
      status: "registered",
      rsvpAt: new Date(),
    })
    .onConflictDoNothing();

  revalidatePath(`/activities/${eventId}`);
  revalidatePath("/activities");
}

export async function cancelRsvp(eventId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof eventId !== "string" || !eventId) throw new Error("Invalid event");

  await db
    .delete(eventAttendance)
    .where(
      and(
        eq(eventAttendance.eventId, eventId),
        eq(eventAttendance.userId, me.id),
      ),
    );

  revalidatePath(`/activities/${eventId}`);
  revalidatePath("/activities");
}

// Self check-in at the event. Marks attendance, which feeds the roadmap
// "attend an activity" step (progress is derived from attended count).
export async function checkIn(eventId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  await loadEvent(eventId);

  await db
    .update(eventAttendance)
    .set({ status: "attended", checkedInAt: new Date() })
    .where(
      and(
        eq(eventAttendance.eventId, eventId),
        eq(eventAttendance.userId, me.id),
      ),
    );

  revalidatePath(`/activities/${eventId}`);
}
