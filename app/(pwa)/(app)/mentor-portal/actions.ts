"use server";

import { auth } from "@clerk/nextjs/server";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { mentorships, milestones, tasks, users } from "@/db/schema";
import { DEFAULT_TASK_POINTS } from "@/lib/growth";
import { applyTaskComplete, applyTaskFail } from "@/lib/growth-tree";
import { MENTOR_CAPACITY } from "@/lib/match";
import { notifyUser } from "@/lib/notify";

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
): Promise<{ ok: boolean; reason?: "full" | "not_found" }> {
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

  await db
    .update(mentorships)
    .set({ status: "active", lastActivityAt: new Date() })
    .where(eq(mentorships.id, mentorshipId));

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

export async function assignTask(input: {
  mentorshipId: string;
  title: string;
  description: string;
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

  await db.insert(tasks).values({
    mentorshipId: m.id,
    title,
    description: description || null,
    growthPoints: DEFAULT_TASK_POINTS,
  });

  if (m.menteeId) revalidatePath(`/mentor-portal/${m.menteeId}`);
}

// Load a task plus the mentee it belongs to, asserting mentor ownership.
async function taskForMentor(taskId: string, mentorId: string) {
  const [row] = await db
    .select({
      id: tasks.id,
      status: tasks.status,
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

export async function completeTask(taskId: string) {
  const me = await requireMentor();
  const task = await taskForMentor(taskId, me.id);
  if (task.status !== "assigned") return; // already resolved

  await db
    .update(tasks)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(tasks.id, taskId));

  if (task.menteeId) {
    await applyTaskComplete(task.menteeId, task.growthPoints);
    revalidatePath(`/mentor-portal/${task.menteeId}`);
  }
}

export async function failTask(taskId: string) {
  const me = await requireMentor();
  const task = await taskForMentor(taskId, me.id);
  if (task.status !== "assigned") return;

  await db
    .update(tasks)
    .set({ status: "failed", failedAt: new Date() })
    .where(eq(tasks.id, taskId));

  if (task.menteeId) {
    await applyTaskFail(task.menteeId);
    revalidatePath(`/mentor-portal/${task.menteeId}`);
  }
}
