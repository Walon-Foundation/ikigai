"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { meetingVerifications, mentorships, milestones } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { isVerificationMethod } from "@/lib/verification";

// Verify one of the three required in-person meetings. Either party in the
// mentorship can confirm. Meetings must be verified in order, and each meeting
// number can only be verified once (unique index). Meeting 3 graduates the
// mentee and records the milestone that feeds the roadmap.
export async function verifyMeeting(data: {
  mentorshipId: string;
  meetingNumber: number;
  method: string;
  lat?: string;
  lng?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  if (typeof data.mentorshipId !== "string" || !data.mentorshipId) {
    throw new Error("Invalid mentorship");
  }
  const meetingNumber = Number(data.meetingNumber);
  if (![1, 2, 3].includes(meetingNumber)) {
    throw new Error("Invalid meeting number");
  }
  const method = isVerificationMethod(data.method) ? data.method : "photo";

  // Caller must belong to this mentorship.
  const [mentorship] = await db
    .select({
      id: mentorships.id,
      menteeId: mentorships.menteeId,
      mentorId: mentorships.mentorId,
    })
    .from(mentorships)
    .where(eq(mentorships.id, data.mentorshipId))
    .limit(1);
  if (!mentorship) throw new Error("Mentorship not found");
  if (mentorship.menteeId !== me.id && mentorship.mentorId !== me.id) {
    throw new Error("Forbidden");
  }

  // Meetings happen in order.
  const done = await db
    .select({ meetingNumber: meetingVerifications.meetingNumber })
    .from(meetingVerifications)
    .where(eq(meetingVerifications.mentorshipId, data.mentorshipId));
  const doneNumbers = new Set(done.map((d) => d.meetingNumber));
  if (doneNumbers.has(meetingNumber)) return; // idempotent
  if (meetingNumber > 1 && !doneNumbers.has(meetingNumber - 1)) {
    throw new Error("Verify the previous meeting first");
  }

  const lat = typeof data.lat === "string" ? data.lat.slice(0, 32) : null;
  const lng = typeof data.lng === "string" ? data.lng.slice(0, 32) : null;

  await db
    .insert(meetingVerifications)
    .values({
      mentorshipId: data.mentorshipId,
      meetingNumber,
      method,
      lat,
      lng,
    })
    .onConflictDoNothing();

  // Graduation milestone for the mentee (feeds roadmap + unlocks review prompt).
  if (meetingNumber === 3 && mentorship.menteeId) {
    await db
      .insert(milestones)
      .values({ userId: mentorship.menteeId, type: "graduation" })
      .onConflictDoNothing();
    await db
      .update(mentorships)
      .set({ status: "closed" })
      .where(and(eq(mentorships.id, data.mentorshipId)));
  }

  revalidatePath(`/mentorship/${data.mentorshipId}/verify`);
}
