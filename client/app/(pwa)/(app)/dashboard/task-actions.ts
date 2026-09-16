"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// What a mentee can do to their own task: file evidence, and send it.
//
// There is deliberately no "complete my task" path. That action once moved a
// task straight to 'completed' and awarded its growth points — the hole in the
// rule that only a mentor presses complete. Deleting the button would have left
// the endpoint, so the endpoint went too. Nothing here moves a task past
// 'submitted', and the API enforces that rather than trusting this file.

async function me() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export async function chooseEvidenceKind(taskId: string, kind: string) {
  const user = await me();
  await apiFetch(`/tasks/${taskId}/evidence-kind`, {
    method: "POST",
    userId: user.id,
    body: { kind },
  });
  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
}

export async function submitTest(
  taskId: string,
  answers: Record<string, number>,
) {
  const user = await me();
  const result = await apiFetch<{
    score: number;
    total: number;
    passed: boolean;
  }>(`/tasks/${taskId}/test`, {
    method: "POST",
    userId: user.id,
    body: { answers },
  });
  revalidatePath(`/tasks/${taskId}`);
  return result;
}

export async function submitTaskForReview(taskId: string, note?: string) {
  const user = await me();
  const result = await apiFetch<{ ok: boolean; missing: string[] }>(
    `/tasks/${taskId}/submit`,
    { method: "POST", userId: user.id, body: { note } },
  );
  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  return result;
}
