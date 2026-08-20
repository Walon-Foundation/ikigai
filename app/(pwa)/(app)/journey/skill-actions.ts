"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/db-user";
import { completeOwnMilestone, submitOwnMilestone } from "@/lib/skill-tracks";

export async function completeMilestone(milestoneId: string) {
  const me = await requireRole(["mentee"]);
  if (typeof milestoneId !== "string" || !milestoneId) {
    throw new Error("Invalid milestone");
  }
  await completeOwnMilestone(milestoneId, me.id);
  revalidatePath("/journey");
}

export async function submitMilestone(milestoneId: string) {
  const me = await requireRole(["mentee"]);
  if (typeof milestoneId !== "string" || !milestoneId) {
    throw new Error("Invalid milestone");
  }
  await submitOwnMilestone(milestoneId, me.id);
  revalidatePath("/journey");
}
