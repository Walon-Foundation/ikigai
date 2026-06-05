"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { milestones, safetyReports, users } from "@/db/schema";

const REPORT_TYPES = ["inappropriate", "concern"] as const;
const MAX_REPORT_NOTES = 5_000;

export async function submitSafetyReport(data: {
  type: string;
  notes: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Client args are unverified — validate before persisting.
  const type = (REPORT_TYPES as readonly string[]).includes(data.type)
    ? data.type
    : "concern";
  const notes =
    typeof data.notes === "string"
      ? data.notes.trim().slice(0, MAX_REPORT_NOTES)
      : "";

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");

  await db.insert(safetyReports).values({
    reporterId: user.id,
    type,
    notes,
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
