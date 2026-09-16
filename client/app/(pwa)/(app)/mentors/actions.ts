"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// A mentee or parent leaves (or updates) a rating and testimonial for a mentor.
// One review per author per mentor, enforced by a unique index in the API.
export async function submitMentorReview(data: {
  mentorId: string;
  rating: number;
  comment?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/mentorship/reviews", {
    method: "POST",
    userId: me.id,
    body: data,
  });

  revalidatePath(`/mentors/${data.mentorId}`);
}
