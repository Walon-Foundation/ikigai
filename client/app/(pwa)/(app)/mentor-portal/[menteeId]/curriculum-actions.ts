"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// The shared curriculum. Who may write to it — mentor-only for structure,
// either party for progress, and an approved mentor for both — is decided in
// the API's CurriculumService.

async function me() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export async function addCurriculumItem(input: {
  mentorshipId: string;
  title: string;
  description?: string;
  targetDate?: string | null;
}) {
  const user = await me();
  await apiFetch("/mentorship/curriculum", {
    method: "POST",
    userId: user.id,
    body: input,
  });
  revalidatePath("/mentor-portal");
}

export async function editCurriculumItem(input: {
  id: string;
  title: string;
  description?: string;
}) {
  const user = await me();
  await apiFetch(`/mentorship/curriculum/${input.id}/edit`, {
    method: "POST",
    userId: user.id,
    body: { title: input.title, description: input.description },
  });
  revalidatePath("/mentor-portal");
}

export async function deleteCurriculumItem(id: string) {
  const user = await me();
  await apiFetch(`/mentorship/curriculum/${id}/delete`, {
    method: "POST",
    userId: user.id,
  });
  revalidatePath("/mentor-portal");
}

export async function moveCurriculumItem(id: string, direction: "up" | "down") {
  const user = await me();
  await apiFetch(`/mentorship/curriculum/${id}/move`, {
    method: "POST",
    userId: user.id,
    body: { direction },
  });
  revalidatePath("/mentor-portal");
}

export async function setCurriculumItemStatus(input: {
  id: string;
  status: "planned" | "in_progress" | "done";
}) {
  const user = await me();
  await apiFetch(`/mentorship/curriculum/${input.id}/status`, {
    method: "POST",
    userId: user.id,
    body: { status: input.status },
  });
  revalidatePath("/mentor-portal");
}
