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
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new Error("User not found");
  // Only mentees request mentors; mentors/parents must not create mentorships.
  if (me.role !== "mentee") throw new Error("Forbidden");

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
