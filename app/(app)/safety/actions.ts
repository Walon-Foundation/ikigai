"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { milestones, safetyReports, users } from "@/db/schema";

export async function submitSafetyReport(data: {
  type: "inappropriate" | "concern";
  notes: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");

  await db.insert(safetyReports).values({
    reporterId: user.id,
    type: data.type,
    notes: data.notes,
  });
}

export async function awardSafetyMilestone() {
  const { userId } = await auth();
  if (!userId) return;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) return;

  await db
    .insert(milestones)
    .values({ userId: user.id, type: "safety_module" })
    .onConflictDoNothing();
}
