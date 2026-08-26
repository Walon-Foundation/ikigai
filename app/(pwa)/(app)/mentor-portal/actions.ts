"use server";

import { auth } from "@clerk/nextjs/server";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import {
  mentorships,
  milestones,
  taskQuestions,
  taskSubmissions,
  tasks,
  users,
} from "@/db/schema";
import { DEFAULT_TASK_POINTS } from "@/lib/growth";
import { applyTaskComplete, applyTaskFail } from "@/lib/growth-tree";
import { MENTOR_CAPACITY } from "@/lib/match";
import {
  baseEndDate,
  getStageReadiness,
  promoteMenteeStage,
} from "@/lib/mentorship";
import { notifyUser } from "@/lib/notify";
import type { SkillStage } from "@/lib/skill-stages";
import { isSubmissionComplete } from "@/lib/tasks";

async function requireMentor() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [me] = await db
    .select({ id: users.id, role: users.role, displayName: users.displayName })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me || me.role !== "mentor") throw new Error("Forbidden");
  return me;
}

// Confirm the signed-in mentor owns this active mentorship and return the
// mentee it belongs to.
async function mentorshipForMentor(mentorshipId: string, mentorId: string) {
  const [m] = await db
    .select({ id: mentorships.id, menteeId: mentorships.menteeId })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.id, mentorshipId),
        eq(mentorships.mentorId, mentorId),
        eq(mentorships.status, "active"),
      ),
    )
    .limit(1);
  if (!m) throw new Error("Mentorship not found");
  return m;
}

// Accept a pending request. Enforces the per-mentor active cap. Returns the
// result so the UI can explain a refusal rather than silently failing.
export async function acceptRequest(
  mentorshipId: string,
): Promise<{ ok: boolean; reason?: "full" | "not_found" | "already_paired" }> {
  const me = await requireMentor();

  const [request] = await db
    .select({ id: mentorships.id, menteeId: mentorships.menteeId })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.id, mentorshipId),
        eq(mentorships.mentorId, me.id),
        eq(mentorships.status, "requested"),
      ),
    )
    .limit(1);
  if (!request) return { ok: false, reason: "not_found" };

  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(mentorships)
    .where(
      and(eq(mentorships.mentorId, me.id), eq(mentorships.status, "active")),
    );
  if (activeCount >= MENTOR_CAPACITY) return { ok: false, reason: "full" };

  // One mentor at a time. A mentee may hold requests with several mentors —
  // that is how they shop for a match — but the first acceptance closes the
  // question, and a second mentor accepting later must be told why they
  // cannot, not silently create a second pairing.
  if (request.menteeId) {
    const [{ value: menteeActive }] = await db
      .select({ value: count() })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, request.menteeId),
          eq(mentorships.status, "active"),
        ),
      );
    if (menteeActive > 0) return { ok: false, reason: "already_paired" };
  }

  const startedAt = new Date();
  try {
    await db
      .update(mentorships)
      .set({
        status: "active",
        startedAt,
        baseEndsAt: baseEndDate(startedAt),
        lastActivityAt: startedAt,
      })
      .where(eq(mentorships.id, mentorshipId));
  } catch (error) {
    // Most likely the partial unique index refusing it: another mentor accepted
    // this mentee between the check above and this write. The check is not
    // redundant — it answers clearly in the ordinary case — but only the index
    // can settle a genuine race.
    //
    // Confirmed by re-reading rather than assumed from the fact that something
    // threw. A dropped connection also lands here, and reporting that as
    // "already matched" would send the mentor away believing a false thing
    // about their mentee.
    const [{ value: nowActive }] = await db
      .select({ value: count() })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, request.menteeId ?? ""),
          eq(mentorships.status, "active"),
        ),
      );
    if (nowActive > 0) return { ok: false, reason: "already_paired" };
    throw error;
  }

  if (request.menteeId) {
    await db
      .insert(milestones)
      .values({ userId: request.menteeId, type: "mentor_connect" })
      .onConflictDoNothing();

    const menteeId = request.menteeId;
    const mentorName = me.displayName;
    // Defer the push notification past the response — the mentee doesn't
    // need it before the mentor's own UI updates.
    after(async () => {
      await notifyUser({
        userId: menteeId,
        title: "Your mentor accepted! 🎉",
        body: `${mentorName ?? "Your mentor"} accepted your request. Plan your Finding Yourself Picnic to get started.`,
        type: "match",
        url: "/mentorship",
      });
    });
  }

  revalidatePath("/mentor-portal");
  return { ok: true };
}

export async function declineRequest(mentorshipId: string) {
  const me = await requireMentor();
  const [updated] = await db
    .update(mentorships)
    .set({ status: "declined" })
    .where(
      and(
        eq(mentorships.id, mentorshipId),
        eq(mentorships.mentorId, me.id),
        eq(mentorships.status, "requested"),
      ),
    )
    .returning({ menteeId: mentorships.menteeId });

  if (updated?.menteeId) {
    const menteeId = updated.menteeId;
    after(async () => {
      await notifyUser({
        userId: menteeId,
        title: "Mentor request update",
        body: "A mentor couldn't take you on right now. Explore other mentors who match your interests.",
        type: "match",
        url: "/mentors",
      });
    });
  }
  revalidatePath("/mentor-portal");
}

const MAX_TASK_TITLE = 200;
const MAX_TASK_DESC = 2_000;

const MAX_QUESTIONS = 20;
const MAX_OPTIONS = 6;
const MAX_PROMPT = 500;
const MAX_OPTION = 200;

export type NewQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

/**
 * Assign a task, optionally with the on-platform test that evidences it.
 *
 * The mentor has total control of the curriculum, and that includes the test:
 * these questions are the mentor's, written per task, not drawn from a central
 * bank. Everything here is bounded before it is stored — a server action's
 * arguments arrive off a request body, and `options` in particular is an
 * arbitrary array from the client that ends up rendered to a mentee.
 */
export async function assignTask(input: {
  mentorshipId: string;
  title: string;
  description: string;
  stage?: string;
  requiresEvidence?: boolean;
  questions?: NewQuestion[];
}) {
  const me = await requireMentor();
  const m = await mentorshipForMentor(input.mentorshipId, me.id);

  // Validate untrusted client args before persisting.
  const title =
    typeof input.title === "string"
      ? input.title.trim().slice(0, MAX_TASK_TITLE)
      : "";
  if (!title) throw new Error("Title is required");
  const description =
    typeof input.description === "string"
      ? input.description.trim().slice(0, MAX_TASK_DESC)
      : "";

  const stage = STAGES.includes(input.stage as SkillStage)
    ? (input.stage as SkillStage)
    : null;

  const [task] = await db
    .insert(tasks)
    .values({
      mentorshipId: m.id,
      title,
      description: description || null,
      stage,
      requiresEvidence: input.requiresEvidence !== false,
      growthPoints: DEFAULT_TASK_POINTS,
    })
    .returning({ id: tasks.id });

  const questions = cleanQuestions(input.questions);
  if (questions.length > 0) {
    await db.insert(taskQuestions).values(
      questions.map((q, index) => ({
        taskId: task.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        orderIndex: index,
      })),
    );
  }

  if (m.menteeId) revalidatePath(`/mentor-portal/${m.menteeId}`);
  return { taskId: task.id };
}

/**
 * Bound and drop malformed test questions.
 *
 * Silently discarding a bad question rather than throwing is deliberate: these
 * arrive as a batch from a form where a mentor may have left a half-typed row
 * behind, and failing the whole assignment over it would lose the task too. A
 * question needs a prompt, at least two non-empty options, and a correctIndex
 * that actually points at one of them — anything else is not a question.
 */
function cleanQuestions(input: NewQuestion[] | undefined): NewQuestion[] {
  if (!Array.isArray(input)) return [];
  const cleaned: NewQuestion[] = [];
  for (const raw of input.slice(0, MAX_QUESTIONS)) {
    if (!raw || typeof raw !== "object") continue;
    const prompt =
      typeof raw.prompt === "string"
        ? raw.prompt.trim().slice(0, MAX_PROMPT)
        : "";
    if (!prompt) continue;
    const options = Array.isArray(raw.options)
      ? raw.options
          .filter((o): o is string => typeof o === "string")
          .map((o) => o.trim().slice(0, MAX_OPTION))
          .filter(Boolean)
          .slice(0, MAX_OPTIONS)
      : [];
    if (options.length < 2) continue;
    const correctIndex = Number(raw.correctIndex);
    if (!Number.isInteger(correctIndex)) continue;
    if (correctIndex < 0 || correctIndex >= options.length) continue;
    cleaned.push({ prompt, options, correctIndex });
  }
  return cleaned;
}

// Load a task plus the mentee it belongs to, asserting mentor ownership.
async function taskForMentor(taskId: string, mentorId: string) {
  const [row] = await db
    .select({
      id: tasks.id,
      status: tasks.status,
      requiresEvidence: tasks.requiresEvidence,
      growthPoints: tasks.growthPoints,
      menteeId: mentorships.menteeId,
    })
    .from(tasks)
    .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
    .where(and(eq(tasks.id, taskId), eq(mentorships.mentorId, mentorId)))
    .limit(1);
  if (!row) throw new Error("Task not found");
  return row;
}

/**
 * The mentor marks a task complete. Only the mentor reaches this.
 *
 * Refused unless the mentee's evidence bundle is actually complete — a passed
 * test AND a photo, or a PDF. The gate is here rather than only on the screen
 * because the screen is not what enforces it: this is a public endpoint, and a
 * task completed without evidence counts towards stage promotion just the same.
 */
export async function completeTask(
  taskId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const me = await requireMentor();
  const task = await taskForMentor(taskId, me.id);
  if (task.status === "completed" || task.status === "failed") {
    return { ok: true }; // already resolved
  }

  if (task.requiresEvidence) {
    const [submission] = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, task.id))
      .limit(1);
    if (!isSubmissionComplete(submission)) {
      return {
        ok: false,
        reason:
          "This task has no complete evidence yet. Your mentee needs to pass the test and add a photo, or upload a PDF.",
      };
    }
  }

  await db
    .update(tasks)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(tasks.id, taskId));

  if (task.menteeId) {
    await applyTaskComplete(task.menteeId, task.growthPoints);
    revalidatePath(`/mentor-portal/${task.menteeId}`);
  }
  return { ok: true };
}

export async function failTask(taskId: string) {
  const me = await requireMentor();
  const task = await taskForMentor(taskId, me.id);
  if (task.status === "completed" || task.status === "failed") return;

  await db
    .update(tasks)
    .set({ status: "failed", failedAt: new Date() })
    .where(eq(tasks.id, taskId));

  if (task.menteeId) {
    await applyTaskFail(task.menteeId);
    revalidatePath(`/mentor-portal/${task.menteeId}`);
  }
}

const STAGES: SkillStage[] = ["discover", "thrive", "build", "lead"];

/**
 * Promote a mentee to the next programme stage.
 *
 * Mentor-only, and there is no mentee equivalent anywhere — this is the
 * "only the mentor has the privilege to press complete" rule at the stage
 * level. The pacing floor is checked inside promoteMenteeStage(); a mentor
 * cannot waive it, so the answer to "why can't I promote her yet" is always a
 * sentence about tasks and days rather than a disabled button.
 */
export async function promoteMentee(
  mentorshipId: string,
): Promise<{ ok: boolean; reason?: string; to?: string }> {
  const me = await requireMentor();
  const m = await mentorshipForMentor(mentorshipId, me.id);
  if (!m.menteeId) return { ok: false, reason: "Mentorship has no mentee." };

  const result = await promoteMenteeStage({
    menteeId: m.menteeId,
    mentorId: me.id,
    mentorshipId: m.id,
  });

  if (!result.ok) return { ok: false, reason: result.reason };

  const menteeId = m.menteeId;
  const to = result.to;
  after(async () => {
    await notifyUser({
      userId: menteeId,
      title: `You've reached ${to.charAt(0).toUpperCase()}${to.slice(1)}! 🌱`,
      body: "Your mentor moved you up a stage. New clubs and milestones are open to you.",
      type: "milestone",
      url: "/journey",
    });
  });

  revalidatePath(`/mentor-portal/${m.menteeId}`);
  revalidatePath("/journey");
  return { ok: true, to: result.to };
}

/** Pacing status for the mentor's screen. Read-only. */
export async function menteeStageStatus(mentorshipId: string) {
  const me = await requireMentor();
  const m = await mentorshipForMentor(mentorshipId, me.id);
  if (!m.menteeId) return null;
  return getStageReadiness(m.menteeId);
}
