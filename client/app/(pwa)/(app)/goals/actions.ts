"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";
import { activeMentorshipFor } from "@/lib/mentorship";
import { dispatch } from "@/lib/notifications/dispatch";

// Thin callers of the API. The business logic — validation, ownership scoping,
// the database writes — lives in api/src/goals/. That is the whole point: the
// Expo app calls the same endpoints, so there is one implementation rather than
// one per client. See docs/01-api-server.md.
//
// What stays here is what is genuinely Next.js's job: authenticating the
// caller (this app still owns the Clerk session) and revalidating the route.
//
// The mentor notification below is the exception, and a temporary one. It
// belongs in the API's NotificationsModule, which is not ported yet — the
// module carries a 39-key catalog, dispatch, transport and templates. Moving it
// with this commit would have made a pattern-setting change into a large one.

export type Goal = {
  id: string;
  title: string;
  detail: string | null;
  targetDate: string | null;
  status: string;
  createdAt: string | null;
  completedAt: string | null;
};

export async function listGoals(): Promise<Goal[]> {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  return apiFetch<Goal[]>("/goals", { userId: me.id });
}

export async function addGoal(data: {
  title: string;
  detail?: string;
  targetDate?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch<Goal>("/goals", {
    method: "POST",
    userId: me.id,
    body: {
      title: data.title,
      detail: data.detail ?? null,
      // The API wants an ISO datetime or nothing. The form gives a date-only
      // value, which is not one, so it is widened here rather than the API
      // being made to accept two formats.
      targetDate: toIsoOrNull(data.targetDate),
    },
  });

  revalidatePath("/goals");
}

export async function completeGoal(goalId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  const done = await apiFetch<{ id: string; title: string } | null>(
    `/goals/${goalId}/complete`,
    { method: "POST", userId: me.id },
  );

  // Goals are the only thing in the programme a mentee finishes without their
  // mentor pressing anything, which makes this the one real "your mentee is
  // making progress" signal the app has. Everything else that reaches `done`
  // is the mentor's own click, and reporting that back to them would be noise.
  //
  // `done` is null when nothing changed — unknown id, someone else's goal, or
  // already complete — so a repeated tap cannot notify twice.
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

  await apiFetch<{ deleted: boolean }>(`/goals/${goalId}`, {
    method: "DELETE",
    userId: me.id,
  });

  revalidatePath("/goals");
}

/** "2026-12-01" (the date input's value) -> an ISO datetime, or null. */
function toIsoOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
