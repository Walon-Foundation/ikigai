"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/db-user";
import { submitOwnMilestone } from "@/lib/skill-tracks";

// Submitting is the only move a mentee has on a milestone.
//
// completeMilestone() used to sit beside this and took a milestone straight to
// 'done'. Under the programme rule that only a mentor presses complete, an
// action that let a mentee do it was the rule's single largest hole — a server
// action is a public endpoint, so deleting the button would have left the
// endpoint. The action itself had to go.
export async function submitMilestone(milestoneId: string) {
  const me = await requireRole(["mentee"]);
  if (typeof milestoneId !== "string" || !milestoneId) {
    throw new Error("Invalid milestone");
  }
  await submitOwnMilestone(milestoneId, me.id);
  revalidatePath("/journey");
}
