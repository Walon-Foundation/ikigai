"use server";

import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// A mentee requests a mentor. Every rule that decides whether they may — the
// mentee-approval gate, one-mentor-at-a-time, the mentor's capacity, and the
// match score — lives in the API's MentorshipModule now, so the Expo app
// enforces exactly the same ones.
export async function requestMentor(mentorId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  return apiFetch<{ mentorshipId: string }>("/mentorship/request", {
    method: "POST",
    userId: me.id,
    body: { mentorId },
  });
}
