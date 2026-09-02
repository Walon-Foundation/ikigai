"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { mentorships, taskSubmissions, tasks } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { dispatch } from "@/lib/notifications/dispatch";
import {
  gradeTest,
  isEvidenceKind,
  isSubmissionComplete,
  missingEvidence,
} from "@/lib/tasks";

const MAX_NOTE = 1_000;

// What a mentee can do to their own task: file evidence, and send it.
//
// completeMyTask() used to live here and moved a task straight to 'completed',
// awarding its growth points. Under the programme rule that only a mentor
// presses complete, that action was the rule's hole — deleting the button would
// have left the endpoint, and a server action is reachable by any signed-in
// user whatever page rendered it. So it is gone, and what replaces it can only
// ever move a task as far as 'submitted'.

/** Resolve a task belonging to a mentorship this mentee is actually in. */
async function ownTask(taskId: string, menteeId: string) {
  const [row] = await db
    .select({
      id: tasks.id,
      status: tasks.status,
      requiresEvidence: tasks.requiresEvidence,
      mentorshipId: tasks.mentorshipId,
      mentorId: mentorships.mentorId,
    })
    .from(tasks)
    .innerJoin(
      mentorships,
      and(
        eq(tasks.mentorshipId, mentorships.id),
        eq(mentorships.menteeId, menteeId),
      ),
    )
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!row) throw new Error("Task not found");
  return row;
}

/**
 * Pull a task back out of review when its evidence changes.
 *
 * Without this, a mentee could rewrite their submission — or wipe it, since
 * switching kind clears the other kind's fields — while the task still read
 * 'submitted' and their mentor was looking at it. The mentor would then be
 * reviewing something that no longer exists, and pressing Complete would be
 * refused with no explanation the mentee ever sees.
 *
 * Reverting to 'assigned' keeps one property true: a task in review is a task
 * whose evidence is not moving. The mentee sends it again when they are ready.
 */
async function reopenIfSubmitted(task: { id: string; status: string }) {
  if (task.status !== "submitted") return;
  await db
    .update(tasks)
    .set({ status: "assigned", submittedAt: null })
    .where(and(eq(tasks.id, task.id), eq(tasks.status, "submitted")));
}

/**
 * Choose how to evidence a task: the on-platform test plus a photo, or a PDF.
 *
 * Creates or replaces the submission row. Switching kind clears the other
 * kind's fields — a mentee who passed the test, then changed their mind and
 * uploaded a PDF, must not end up with a row that looks half-complete under
 * both rules at once.
 */
export async function chooseEvidenceKind(taskId: string, kind: string) {
  const me = await requireRole(["mentee"]);
  if (!isEvidenceKind(kind)) throw new Error("Invalid submission type");
  const task = await ownTask(taskId, me.id);
  if (task.status === "completed" || task.status === "failed") return;

  await reopenIfSubmitted(task);

  await db
    .insert(taskSubmissions)
    .values({ taskId: task.id, menteeId: me.id, kind })
    .onConflictDoUpdate({
      target: taskSubmissions.taskId,
      set: {
        kind,
        testScore: null,
        testTotal: null,
        testPassedAt: null,
        photoFileKey: null,
        photoFileName: null,
        pdfFileKey: null,
        pdfFileName: null,
        submittedAt: new Date(),
      },
    });

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
}

/**
 * Answer the task's test.
 *
 * `answers` is question id → chosen option index. Grading happens in
 * lib/tasks.ts against the stored key: the answer key is never sent to the
 * browser, and this action never accepts a score from the client — only the
 * choices, which it marks itself.
 */
export async function submitTest(
  taskId: string,
  answers: Record<string, number>,
) {
  const me = await requireRole(["mentee"]);
  const task = await ownTask(taskId, me.id);
  if (task.status === "completed" || task.status === "failed") {
    throw new Error("This task is already resolved");
  }

  // Coerce the untrusted map to plain question-id → integer before it is used.
  const clean: Record<string, number> = {};
  if (answers && typeof answers === "object") {
    for (const [id, choice] of Object.entries(answers)) {
      if (typeof id === "string" && Number.isInteger(choice)) {
        clean[id] = choice as number;
      }
    }
  }

  const result = await gradeTest(task.id, clean);
  if (result.total === 0) throw new Error("This task has no test");

  await reopenIfSubmitted(task);

  await db
    .insert(taskSubmissions)
    .values({
      taskId: task.id,
      menteeId: me.id,
      kind: "test_and_photo",
      testScore: result.score,
      testTotal: result.total,
      testPassedAt: result.passed ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: taskSubmissions.taskId,
      set: {
        kind: "test_and_photo",
        testScore: result.score,
        testTotal: result.total,
        // Cleared on a failed retake, so a pass cannot be banked and then kept
        // while the mentee's later attempts get worse.
        testPassedAt: result.passed ? new Date() : null,
      },
    });

  revalidatePath(`/tasks/${taskId}`);
  return result;
}

/**
 * Send the task to the mentor for review.
 *
 * Refuses unless the evidence bundle is actually complete — the same
 * isSubmissionComplete() the mentor's complete button reads, so the two screens
 * cannot disagree about whether this task is ready.
 */
export async function submitTaskForReview(taskId: string, note?: string) {
  const me = await requireRole(["mentee"]);
  const task = await ownTask(taskId, me.id);
  if (task.status !== "assigned") return { ok: false as const, missing: [] };

  const [submission] = await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.taskId, task.id))
    .limit(1);

  if (task.requiresEvidence && !isSubmissionComplete(submission)) {
    return { ok: false as const, missing: missingEvidence(submission) };
  }

  const trimmed =
    typeof note === "string" ? note.trim().slice(0, MAX_NOTE) || null : null;
  if (submission && trimmed) {
    await db
      .update(taskSubmissions)
      .set({ note: trimmed, submittedAt: new Date() })
      .where(eq(taskSubmissions.taskId, task.id));
  }

  await db
    .update(tasks)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(and(eq(tasks.id, task.id), eq(tasks.status, "assigned")));

  if (task.mentorId) {
    const mentorId = task.mentorId;
    after(async () => {
      await dispatch({ key: "TASK_SUBMITTED", to: mentorId });
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true as const, missing: [] };
}
