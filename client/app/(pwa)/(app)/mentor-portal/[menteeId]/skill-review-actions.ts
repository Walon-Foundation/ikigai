"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedMentor } from "@/lib/db-user";
import { reviewMilestone } from "@/lib/skill-tracks";

export async function approveMilestone(milestoneId: string, menteeId: string) {
  const me = await requireApprovedMentor();
  if (typeof milestoneId !== "string" || !milestoneId) {
    throw new Error("Invalid milestone");
  }
  await reviewMilestone(milestoneId, me.id, "approve", null);
  revalidatePath(`/mentor-portal/${menteeId}`);
}

export async function requestRevision(
  milestoneId: string,
  menteeId: string,
  feedback: string,
) {
  const me = await requireApprovedMentor();
  if (typeof milestoneId !== "string" || !milestoneId) {
    throw new Error("Invalid milestone");
  }
  await reviewMilestone(milestoneId, me.id, "revise", feedback.trim() || null);
  revalidatePath(`/mentor-portal/${menteeId}`);
}
