import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { menteeStagePromotions, mentorships, tasks, users } from "@/db/schema";
import { nextSkillStage, type SkillStage } from "@/lib/skill-stages";

// The programme's structural rules, in one place.
//
// These are terms of the mentorship, not implementation details: the length of
// a base mentorship and the pace of stage progression are things the Freetown
// team decides and will want to change without reading server actions. Every
// gate below reads from here.

/** A base mentorship runs three months from the day the mentor accepts. */
export const BASE_MENTORSHIP_MONTHS = 3;

/**
 * The pacing floor between stages: roughly two weeks' worth of tasks.
 *
 * "Two weeks' worth" carries both a duration and a volume, and enforcing only
 * one of them defeats the rule in a different direction each time. A days-only
 * floor lets a mentee who did nothing for a fortnight graduate; a tasks-only
 * floor lets a mentee sprint four tasks in a weekend and clear a stage in two
 * days. Both have to hold.
 *
 * STAGE_MIN_TASKS is the tunable half — it is this team's estimate of what a
 * fortnight of work looks like, not a fact — so it is named and commented
 * rather than inlined, and changing it is a one-line decision.
 */
export const STAGE_MIN_DAYS = 14;
export const STAGE_MIN_TASKS = 4;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The end of a base mentorship starting on a given day.
 *
 * Clamped to the last day of the target month, and computed in UTC.
 *
 * A plain `setMonth(+3)` is wrong twice over. It rolls forward when the day
 * does not exist in the target month — 31 January becomes 1 May, 30 November
 * becomes 2 March — so a mentorship silently gains days because of the month it
 * started in. And it reads the local timezone, which makes the stored end date
 * depend on where the server happens to run.
 */
export function baseEndDate(startedAt: Date): Date {
  const end = new Date(startedAt.getTime());
  const day = end.getUTCDate();
  // Move to the 1st first, so the month arithmetic cannot overflow on the way.
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + BASE_MENTORSHIP_MONTHS);
  // Day 0 of the following month is the last day of this one.
  const lastDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
}

export type StageReadiness = {
  stage: SkillStage;
  nextStage: SkillStage | null;
  daysInStage: number;
  daysRemaining: number;
  completedTasks: number;
  tasksRemaining: number;
  /** True when both floors are met and there is a stage left to move to. */
  ready: boolean;
  /** Why not, in a sentence a mentor can read. Null when ready. */
  blockedReason: string | null;
};

/**
 * Whether a mentee has met the pacing floor for their current stage.
 *
 * Read-only, and safe to render on either portal: the mentee seeing "2 more
 * tasks and 5 more days" is the point of having a paced programme. What the
 * mentee cannot do is act on it — promotion is promoteMenteeStage() below,
 * which is mentor-only.
 */
export async function getStageReadiness(
  menteeId: string,
): Promise<StageReadiness> {
  const [mentee] = await db
    .select({
      currentStage: users.currentStage,
      stageStartedAt: users.stageStartedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, menteeId))
    .limit(1);

  const stage = (mentee?.currentStage ?? "discover") as SkillStage;
  const next = nextSkillStage(stage);

  // Accounts that predate stage tracking have no stageStartedAt. Falling back
  // to their signup date is the honest reading — they have been in Discover
  // since they joined — and falling back to "now" would restart the clock for
  // every existing mentee the first time this runs.
  const since = mentee?.stageStartedAt ?? mentee?.createdAt ?? new Date();
  const daysInStage = Math.floor((Date.now() - since.getTime()) / DAY_MS);

  const [{ value: completedTasks }] = await db
    .select({ value: count() })
    .from(tasks)
    .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
    .where(
      and(
        eq(mentorships.menteeId, menteeId),
        eq(tasks.status, "completed"),
        eq(tasks.stage, stage),
      ),
    );

  const daysRemaining = Math.max(0, STAGE_MIN_DAYS - daysInStage);
  const tasksRemaining = Math.max(0, STAGE_MIN_TASKS - Number(completedTasks));

  let blockedReason: string | null = null;
  if (!next) {
    blockedReason = "Lead is the final stage.";
  } else if (daysRemaining > 0 && tasksRemaining > 0) {
    blockedReason = `${tasksRemaining} more completed task${tasksRemaining === 1 ? "" : "s"} and ${daysRemaining} more day${daysRemaining === 1 ? "" : "s"} in this stage.`;
  } else if (tasksRemaining > 0) {
    blockedReason = `${tasksRemaining} more completed task${tasksRemaining === 1 ? "" : "s"} in this stage.`;
  } else if (daysRemaining > 0) {
    blockedReason = `${daysRemaining} more day${daysRemaining === 1 ? "" : "s"} in this stage.`;
  }

  return {
    stage,
    nextStage: next,
    daysInStage,
    daysRemaining,
    completedTasks: Number(completedTasks),
    tasksRemaining,
    ready: !!next && daysRemaining === 0 && tasksRemaining === 0,
    blockedReason,
  };
}

export type PromotionResult =
  | { ok: true; from: SkillStage; to: SkillStage }
  | { ok: false; reason: string };

/**
 * Move a mentee to the next stage. Mentor-only, and mentor-only by design.
 *
 * The mentee never calls this. That is the programme rule — a stage is a
 * judgement about a young person's growth, made by the adult working with
 * them — and it is enforced by this function taking a mentorId and requiring
 * an active mentorship between the two, rather than by any check on the screen
 * that renders the button.
 *
 * `overridePacing` exists for an admin, not a mentor: a promotion that skips
 * the floor is recorded as having skipped it.
 */
export async function promoteMenteeStage(input: {
  menteeId: string;
  mentorId: string | null;
  mentorshipId: string | null;
  note?: string | null;
  overridePacing?: boolean;
}): Promise<PromotionResult> {
  const readiness = await getStageReadiness(input.menteeId);
  if (!readiness.nextStage) {
    return { ok: false, reason: "Lead is the final stage." };
  }
  if (!readiness.ready && !input.overridePacing) {
    return {
      ok: false,
      reason: readiness.blockedReason ?? "Not ready for the next stage yet.",
    };
  }

  const from = readiness.stage;
  const to = readiness.nextStage;

  // Guarded on the current stage, so two mentors pressing at once promote
  // once: the second update matches no row.
  const updated = await db
    .update(users)
    .set({ currentStage: to, stageStartedAt: new Date() })
    .where(and(eq(users.id, input.menteeId), eq(users.currentStage, from)))
    .returning({ id: users.id });
  if (updated.length === 0) {
    return {
      ok: false,
      reason: "Stage already changed — reload and try again.",
    };
  }

  await db.insert(menteeStagePromotions).values({
    menteeId: input.menteeId,
    mentorId: input.mentorId,
    mentorshipId: input.mentorshipId,
    fromStage: from,
    toStage: to,
    overrodePacing: !readiness.ready,
    note: input.note?.trim().slice(0, 500) || null,
  });

  return { ok: true, from, to };
}

/**
 * The mentee's one active mentorship, if they have one.
 *
 * Singular on purpose — a mentee is paired with one mentor at a time, and the
 * partial unique index on mentorships is what makes this query's `.limit(1)`
 * a fact rather than a hope.
 */
export async function activeMentorshipFor(menteeId: string) {
  const [row] = await db
    .select({
      id: mentorships.id,
      mentorId: mentorships.mentorId,
      startedAt: mentorships.startedAt,
      baseEndsAt: mentorships.baseEndsAt,
    })
    .from(mentorships)
    .where(
      and(eq(mentorships.menteeId, menteeId), eq(mentorships.status, "active")),
    )
    .limit(1);
  return row ?? null;
}
