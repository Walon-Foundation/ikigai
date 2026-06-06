"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { goals } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

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

  await db
    .update(goals)
    .set({ status: "done", completedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, me.id)));

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
