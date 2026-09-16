"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// Submitting is the only move a mentee has on a milestone.
//
// completeMilestone() used to sit beside this and took a milestone straight to
// 'done'. Under the programme rule that only a mentor presses complete, that
// was the rule's single largest hole — and since an endpoint is reachable
// whatever screen calls it, deleting the button would have left the hole. The
// action had to go, and the API has no equivalent either.
export async function submitMilestone(milestoneId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch(`/skills/milestones/${milestoneId}/submit`, {
    method: "POST",
    userId: me.id,
  });

  revalidatePath("/journey");
}
