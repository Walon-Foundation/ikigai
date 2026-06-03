"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { mentorships, milestones, users } from "@/db/schema";

export async function connectWithMentor(mentorId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [me] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new Error("User not found");

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
    .values({ menteeId: me.id, mentorId, status: "icebreaker", matchScore: 85 })
    .returning({ id: mentorships.id });

  await db
    .insert(milestones)
    .values({ userId: me.id, type: "mentor_connect" })
    .onConflictDoNothing();

  return { mentorshipId: row.id };
}
