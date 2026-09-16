"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { goals } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { activeMentorshipFor } from "@/lib/mentorship";
import { dispatch } from "@/lib/notifications/dispatch";

const MAX_TITLE = 200;
const MAX_DETAIL = 1_000;

export async function addGoal(data: {
  title: string;
  detail?: string;
  targetDate?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  const title =
    typeof data.title === "string" ? data.title.trim().slice(0, MAX_TITLE) : "";
  if (!title) throw new Error("Goal title is required");
  const detail =
    typeof data.detail === "string"
      ? data.detail.trim().slice(0, MAX_DETAIL) || null
      : null;
  const targetDate = data.targetDate ? new Date(data.targetDate) : null;

  await db.insert(goals).values({
    userId: me.id,
    title,
    detail,
    targetDate:
      targetDate && !Number.isNaN(targetDate.getTime()) ? targetDate : null,
  });

  revalidatePath("/goals");
}

export async function completeGoal(goalId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof goalId !== "string" || !goalId) throw new Error("Invalid goal");

  const [done] = await db
    .update(goals)
    .set({ status: "done", completedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, me.id)))
    .returning({ id: goals.id, title: goals.title });

  // Goals are the only thing in the programme a mentee finishes without their
  // mentor pressing anything, which makes this the one real "your mentee is
  // making progress" signal the app has. Everything else that reaches `done`
  // is the mentor's own click, and reporting that back to them would be noise.
  if (done) {
    const menteeId = me.id;
    const menteeName = me.displayName;
    after(async () => {
      const mentorship = await activeMentorshipFor(menteeId);
      if (!mentorship?.mentorId) return;
      await dispatch({
        key: "MENTEE_ACTIVITY_COMPLETED",
        to: mentorship.mentorId,
        vars: {
          mentee: menteeName ?? "Your mentee",
          item: done.title,
          menteeId,
        },
        dedupe: `${done.id}:done`,
      });
    });
  }

  revalidatePath("/goals");
}

export async function deleteGoal(goalId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof goalId !== "string" || !goalId) throw new Error("Invalid goal");

  await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, me.id)));

  revalidatePath("/goals");
}
