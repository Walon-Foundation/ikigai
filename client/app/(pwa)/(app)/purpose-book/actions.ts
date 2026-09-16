"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { users } from "@/db/schema";

const MAX_VISION = 4_000;

// The Purpose Book's "Life Vision" module is the one free-text field the mentee
// authors after onboarding; everything else is derived from the assessment.
export async function saveLifeVision(vision: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const text =
    typeof vision === "string" ? vision.trim().slice(0, MAX_VISION) : "";

  const [row] = await db
    .select({ onboardingData: users.onboardingData })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  const current = (row?.onboardingData as Record<string, unknown> | null) ?? {};

  await db
    .update(users)
    .set({ onboardingData: { ...current, lifeVision: text } })
    .where(eq(users.clerkId, userId));

  revalidatePath("/purpose-book");
}
