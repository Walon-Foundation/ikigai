"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// The mentor's side of the loop. Every rule lives in the API now — the
// per-mentor capacity cap, the one-mentor-at-a-time race handling, the evidence
// gate on completion, and the pacing floor on promotion. This file authenticates
// and revalidates; it decides nothing.

export type NewQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

async function me() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export async function acceptRequest(
  mentorshipId: string,
): Promise<{ ok: boolean; reason?: "full" | "not_found" | "already_paired" }> {
  const user = await me();
  const result = await apiFetch<{
    ok: boolean;
    reason?: "full" | "not_found" | "already_paired";
  }>(`/mentorship/${mentorshipId}/accept`, { method: "POST", userId: user.id });
  revalidatePath("/mentor-portal");
  return result;
}

export async function declineRequest(mentorshipId: string) {
  const user = await me();
  await apiFetch(`/mentorship/${mentorshipId}/decline`, {
    method: "POST",
    userId: user.id,
  });
  revalidatePath("/mentor-portal");
}

export async function assignTask(input: {
  mentorshipId: string;
  title: string;
  description: string;
  stage?: string;
  requiresEvidence?: boolean;
  questions?: NewQuestion[];
}) {
  const user = await me();
  const result = await apiFetch<{ taskId: string }>("/tasks", {
    method: "POST",
    userId: user.id,
    body: input,
  });
  revalidatePath("/mentor-portal");
  return result;
}

export async function completeTask(
  taskId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const user = await me();
  const result = await apiFetch<{ ok: boolean; reason?: string }>(
    `/tasks/${taskId}/complete`,
    { method: "POST", userId: user.id },
  );
  revalidatePath("/mentor-portal");
  return result;
}

export async function failTask(taskId: string) {
  const user = await me();
  await apiFetch(`/tasks/${taskId}/fail`, { method: "POST", userId: user.id });
  revalidatePath("/mentor-portal");
}

export async function promoteMentee(
  mentorshipId: string,
): Promise<{ ok: boolean; reason?: string; to?: string }> {
  const user = await me();
  const result = await apiFetch<{ ok: boolean; reason?: string; to?: string }>(
    `/mentorship/${mentorshipId}/promote`,
    { method: "POST", userId: user.id },
  );
  revalidatePath("/mentor-portal");
  revalidatePath("/journey");
  return result;
}

/** Pacing status for the mentor's screen. Read-only. */
export async function menteeStageStatus(mentorshipId: string) {
  const user = await me();
  return apiFetch(`/mentorship/${mentorshipId}/stage-status`, {
    userId: user.id,
  });
}
