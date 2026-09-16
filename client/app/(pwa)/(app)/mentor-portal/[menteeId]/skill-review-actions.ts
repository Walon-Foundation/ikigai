"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

async function me() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export async function approveMilestone(milestoneId: string, menteeId: string) {
  const user = await me();
  await apiFetch(`/skills/milestones/${milestoneId}/approve`, {
    method: "POST",
    userId: user.id,
  });
  revalidatePath(`/mentor-portal/${menteeId}`);
}

export async function requestRevision(
  milestoneId: string,
  menteeId: string,
  feedback: string,
) {
  const user = await me();
  await apiFetch(`/skills/milestones/${milestoneId}/revise`, {
    method: "POST",
    userId: user.id,
    body: { feedback },
  });
  revalidatePath(`/mentor-portal/${menteeId}`);
}
