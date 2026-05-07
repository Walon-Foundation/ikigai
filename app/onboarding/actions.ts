"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { users, milestones } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function completeOnboarding(data: {
  role: "mentee" | "mentor" | "club_lead";
  interestTags: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ role: data.role, interestTags: data.interestTags })
      .where(eq(users.clerkId, userId));

    await db
      .insert(milestones)
      .values({ userId: existing.id, type: "purpose_quiz" })
      .onConflictDoNothing();
  } else {
    const clerkUser = await currentUser();
    const displayName =
      clerkUser?.fullName ??
      ([clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "User");

    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: userId,
        role: data.role,
        displayName,
        interestTags: data.interestTags,
        growthLevel: 1,
      })
      .returning();

    await db.insert(milestones).values({ userId: newUser.id, type: "purpose_quiz" });
  }

  redirect("/dashboard");
}
