"use server";

import { auth } from "@clerk/nextjs/server";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/db";
import { mentorships, users } from "@/db/schema";
import { MENTOR_CAPACITY, matchScore } from "@/lib/match";

// A mentee requests a mentor. Creates a 'requested' mentorship the mentor must
// accept before chat or tasks unlock. The match score is computed from the
// overlap between the two parties' interest tags at request time.
export async function requestMentor(mentorId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [me] = await db
    .select({
      id: users.id,
      role: users.role,
      interestTags: users.interestTags,
      verifiedAt: users.verifiedAt,
      rejectedAt: users.rejectedAt,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new Error("User not found");
  // Only mentees request mentors; mentors/parents must not create mentorships.
  if (me.role !== "mentee") throw new Error("Forbidden");

  // Mentees are approved before they can be matched, the same way mentors are.
  // The gate is on being MATCHED, not on using the app: an applicant waiting on
  // review keeps their journal, their journey and their clubs, and only this
  // one door is shut. Mirrors what the mentor verification screen promises its
  // own applicants.
  if (!me.verifiedAt) {
    throw new Error(
      me.rejectedAt
        ? "Your application wasn't approved. Contact the ikigai team if you think this is a mistake."
        : "Your application is still being reviewed. You'll be able to request a mentor once the ikigai team approves it.",
    );
  }

  // One mentor at a time. Checked before the request is even created, so a
  // mentee who is already paired is told plainly instead of accumulating
  // requests no mentor is allowed to accept.
  const [{ activeCount: myActive }] = await db
    .select({ activeCount: count() })
    .from(mentorships)
    .where(
      and(eq(mentorships.menteeId, me.id), eq(mentorships.status, "active")),
    );
  if (Number(myActive) > 0) {
    throw new Error(
      "You already have a mentor. A mentee works with one mentor at a time — end your current mentorship before requesting another.",
    );
  }

  const [mentor] = await db
    .select({ id: users.id, interestTags: users.interestTags })
    .from(users)
    // Defense in depth: cannot request a mentor ikigai hasn't approved.
    .where(
      and(
        eq(users.id, mentorId),
        eq(users.role, "mentor"),
        isNotNull(users.verifiedAt),
      ),
    )
    .limit(1);
  if (!mentor) throw new Error("Mentor not found");

  // Respect mentor capacity (PRD: 2 active mentees per mentor).
  const [{ activeCount }] = await db
    .select({ activeCount: count() })
    .from(mentorships)
    .where(
      and(eq(mentorships.mentorId, mentorId), eq(mentorships.status, "active")),
    );
  if (Number(activeCount) >= MENTOR_CAPACITY) {
    throw new Error("This mentor is at full capacity");
  }

  const existing = await db
    .select({ id: mentorships.id })
    .from(mentorships)
    .where(
      and(eq(mentorships.menteeId, me.id), eq(mentorships.mentorId, mentorId)),
    )
    .limit(1);
  if (existing.length > 0) return { mentorshipId: existing[0].id };

  const [row] = await db
    .insert(mentorships)
    .values({
      menteeId: me.id,
      mentorId,
      status: "requested",
      matchScore: matchScore(me.interestTags, mentor.interestTags),
    })
    .returning({ id: mentorships.id });

  return { mentorshipId: row.id };
}
