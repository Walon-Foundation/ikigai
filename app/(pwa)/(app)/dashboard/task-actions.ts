"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { mentorships, tasks } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { applyTaskComplete } from "@/lib/growth-tree";

/**
 * A mentee marks their own task done.
 *
 * completeTask() has only ever existed in mentor-portal/actions.ts behind
 * requireMentor(), so the only person who could complete a mentee's task was
 * their mentor. The dashboard rendered the tasks as plain divs with no
 * affordance at all. Tasks drive growth points and tree health — the whole
 * mechanic the app is built around — and the mentee couldn't take part in it.
 */
export async function completeMyTask(taskId: string) {
  const me = await requireRole(["mentee"]);
  if (typeof taskId !== "string" || !taskId) throw new Error("Invalid task");

  // Authorize by joining the mentorship rather than trusting the id: this only
  // matches a task belonging to a mentorship this mentee is actually in.
  const [task] = await db
    .select({
      id: tasks.id,
      status: tasks.status,
      growthPoints: tasks.growthPoints,
      mentorshipId: tasks.mentorshipId,
    })
    .from(tasks)
    .innerJoin(
      mentorships,
      and(
        eq(tasks.mentorshipId, mentorships.id),
        eq(mentorships.menteeId, me.id),
      ),
    )
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) throw new Error("Task not found");
  // Already resolved — a double-tap must not award the points twice.
  if (task.status !== "assigned") return;

  await db
    .update(tasks)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.status, "assigned")));

  await applyTaskComplete(me.id, task.growthPoints);

  revalidatePath("/dashboard");
  revalidatePath("/journey");
  if (task.mentorshipId) revalidatePath(`/mentorship/${task.mentorshipId}`);
}
