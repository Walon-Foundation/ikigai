"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { mentorReviews, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

const MAX_COMMENT = 1_000;

// A mentee/parent leaves (or updates) a rating + testimonial for a mentor.
// One review per author per mentor, enforced by a unique index.
export async function submitMentorReview(data: {
  mentorId: string;
  rating: number;
  comment?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (me.role !== "mentee" && me.role !== "parent") {
    throw new Error("Forbidden");
  }
  if (typeof data.mentorId !== "string" || !data.mentorId) {
    throw new Error("Invalid mentor");
  }

  const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 0)));
  const comment =
    typeof data.comment === "string"
      ? data.comment.trim().slice(0, MAX_COMMENT)
      : null;

  // Confirm the target is actually a mentor.
  const [mentor] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, data.mentorId))
    .limit(1);
  if (!mentor) throw new Error("Mentor not found");

  await db
    .insert(mentorReviews)
    .values({ mentorId: data.mentorId, authorId: me.id, rating, comment })
    .onConflictDoUpdate({
      target: [mentorReviews.mentorId, mentorReviews.authorId],
      set: { rating, comment, createdAt: new Date() },
    });

  revalidatePath(`/mentors/${data.mentorId}`);
}
