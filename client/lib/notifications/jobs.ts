import "server-only";
import {
  and,
  count,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  max,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/db";
import {
  journalEntries,
  mentorships,
  messages,
  skillMilestones,
  skillTracks,
  tasks,
  users,
} from "@/db/schema";
import { getStageReadiness } from "@/lib/mentorship";
import { dispatch, dispatchMany } from "./dispatch";
import { summariseWeek } from "./summary";
import { getRules, type NotificationRules } from "./templates";

// Everything the notification system does on a schedule rather than in response
// to a click. Driven by one daily cron (app/api/cron/notifications), because
// Vercel's Hobby tier allows two cron entries at daily granularity and the
// account purge holds the other one.
//
// Two rules hold across every job here:
//
//   1. Each job is independently try/caught. A failure in the weekly summary
//      must not stop the inactivity nudges that run after it.
//   2. Nothing here decides how often a person may be nudged — the cooldown on
//      each catalogue entry does. These jobs are free to select the same person
//      every day; dispatch is what declines to send.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Milestones untouched for this long earn a "your next step is waiting". */
const STALLED_MILESTONE_DAYS = 7;

export type JobReport = Record<string, number | string>;

export async function runNotificationJobs(
  now = new Date(),
): Promise<JobReport> {
  const rules = await getRules();
  const report: JobReport = {};

  const jobs: [string, () => Promise<number>][] = [
    ["menteeInactivity", () => menteeInactivity(rules, now)],
    ["stalledMilestones", () => stalledMilestones(rules, now)],
    ["mentorCheckIn", () => mentorNudges(rules, now)],
    ["stageReady", () => stageReady()],
    ["weeklySummaries", () => weeklySummaries(rules, now)],
  ];

  for (const [name, run] of jobs) {
    try {
      report[name] = await run();
    } catch (err) {
      console.error(`notifications cron: ${name} failed`, err);
      report[name] = "failed";
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Mentee re-engagement
// ---------------------------------------------------------------------------

/**
 * Nudge mentees who have not opened the app in a while.
 *
 * Deliberately skips anyone whose lastActiveAt is NULL. That is every account
 * that existed before the column did, and treating "unknown" as "absent for
 * ever" would have made the first run of this job send a re-engagement push to
 * the entire platform at once. A user enters this job's reach the first time
 * they open the app after deploy, and not before.
 */
async function menteeInactivity(
  rules: NotificationRules,
  now: Date,
): Promise<number> {
  const gentle = new Date(now.getTime() - rules.menteeInactiveDays * DAY_MS);
  const long = new Date(now.getTime() - rules.menteeInactiveLongDays * DAY_MS);

  const away = await db
    .select({
      id: users.id,
      email: users.email,
      subscription: users.pushSubscription,
      prefs: users.notificationPrefs,
      lastActiveAt: users.lastActiveAt,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "mentee"),
        isNull(users.deletedAt),
        isNotNull(users.lastActiveAt),
        lt(users.lastActiveAt, gentle),
      ),
    );

  // The longer message replaces the shorter one rather than following it — the
  // two say the same thing at different volumes, and someone three weeks away
  // should not get both.
  const longAway = away.filter((u) => u.lastActiveAt && u.lastActiveAt < long);
  const shortAway = away.filter(
    (u) => !(u.lastActiveAt && u.lastActiveAt < long),
  );

  const a = await dispatchMany(shortAway, { key: "INACTIVITY_REMINDER" });
  const b = await dispatchMany(longAway, { key: "INACTIVITY_REMINDER_LONG" });
  return a.persisted + b.persisted;
}

/**
 * Nudge mentees who ARE around but have a milestone sitting untouched.
 *
 * Mutually exclusive with the job above: this one requires recent activity, so
 * nobody receives "your next step is waiting" and "we haven't seen you in a
 * while" in the same week.
 */
async function stalledMilestones(
  rules: NotificationRules,
  now: Date,
): Promise<number> {
  const stillHere = new Date(now.getTime() - rules.menteeInactiveDays * DAY_MS);
  const stalled = new Date(now.getTime() - STALLED_MILESTONE_DAYS * DAY_MS);

  // Which mentees have something available to work on, and one skill name to
  // put in the message.
  const open = await db
    .selectDistinct({
      menteeId: skillTracks.menteeId,
      skill: skillTracks.interestTag,
    })
    .from(skillMilestones)
    .innerJoin(skillTracks, eq(skillMilestones.skillTrackId, skillTracks.id))
    .where(eq(skillMilestones.status, "available"));

  if (open.length === 0) return 0;

  // When each of them last did anything on a milestone at all.
  const touched = await db
    .select({
      menteeId: skillTracks.menteeId,
      lastSubmitted: max(skillMilestones.submittedAt),
      lastCompleted: max(skillMilestones.completedAt),
    })
    .from(skillMilestones)
    .innerJoin(skillTracks, eq(skillMilestones.skillTrackId, skillTracks.id))
    .groupBy(skillTracks.menteeId);

  const lastTouch = new Map<string, number>();
  for (const row of touched) {
    lastTouch.set(
      row.menteeId,
      Math.max(
        row.lastSubmitted?.getTime() ?? 0,
        row.lastCompleted?.getTime() ?? 0,
      ),
    );
  }

  const skillFor = new Map<string, string>();
  for (const row of open) {
    if (!skillFor.has(row.menteeId)) skillFor.set(row.menteeId, row.skill);
  }

  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      subscription: users.pushSubscription,
      prefs: users.notificationPrefs,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "mentee"),
        isNull(users.deletedAt),
        isNotNull(users.lastActiveAt),
        gte(users.lastActiveAt, stillHere),
      ),
    );

  let sent = 0;
  for (const mentee of candidates) {
    const skill = skillFor.get(mentee.id);
    if (!skill) continue;
    if ((lastTouch.get(mentee.id) ?? 0) > stalled.getTime()) continue;

    const result = await dispatch({
      key: "ACTIVITY_REMINDER",
      to: mentee.id,
      vars: { skill },
    });
    sent += result.persisted;
  }
  return sent;
}

// ---------------------------------------------------------------------------
// Mentor prompts
// ---------------------------------------------------------------------------

type ActivePair = {
  mentorshipId: string;
  mentorId: string | null;
  menteeId: string | null;
  menteeName: string | null;
  menteeLastActive: Date | null;
  startedAt: Date | null;
  lastMentorMessageAt: Date | null;
};

/**
 * Every live mentorship, with the two facts both mentor prompts need: when the
 * mentee was last around, and when the mentor last said anything.
 *
 * One query with a correlated subquery rather than a query per mentorship —
 * this runs over the neon-http driver, where each statement is its own HTTPS
 * request.
 */
async function activePairs(): Promise<ActivePair[]> {
  const mentee = alias(users, "mentee");

  const rows = await db
    .select({
      mentorshipId: mentorships.id,
      mentorId: mentorships.mentorId,
      menteeId: mentorships.menteeId,
      menteeName: mentee.displayName,
      menteeLastActive: mentee.lastActiveAt,
      startedAt: mentorships.startedAt,
      lastMentorMessageAt: sql<Date | null>`(
        select max(${messages.createdAt}) from ${messages}
        where ${messages.mentorshipId} = ${mentorships.id}
          and ${messages.senderId} = ${mentorships.mentorId}
      )`,
    })
    .from(mentorships)
    .innerJoin(mentee, eq(mentorships.menteeId, mentee.id))
    .where(and(eq(mentorships.status, "active"), isNull(mentee.deletedAt)));

  // The correlated subquery bypasses Drizzle's column mapping, so this comes
  // back as a raw driver value rather than a Date.
  return rows.map((r) => ({
    ...r,
    lastMentorMessageAt: toUtcDate(r.lastMentorMessageAt),
  }));
}

/**
 * Parse a raw `timestamp without time zone` from the driver.
 *
 * It arrives as "2026-08-26 15:06:42.466412" — no zone marker — and JavaScript
 * reads a string in that shape as LOCAL time. The column holds UTC, so on any
 * machine that is not itself on UTC the value silently shifts by the local
 * offset. Harmless against a seven-day threshold, wrong nonetheless, and the
 * kind of thing that is impossible to spot later because production (Vercel,
 * UTC) is the one place it looks correct.
 */
function toUtcDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(/[Z+]|-\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/**
 * The two mentor-facing prompts, from one pass over the live mentorships.
 *
 * The spec asks for a fixed weekly "check in on your mentee" AND a separate
 * mentor-inactivity reminder, then says the second should be based on real
 * activity rather than a fixed schedule. Those are the same notification, so
 * this is one prompt driven by whether the mentor has actually said anything —
 * a mentor who messaged their mentee yesterday is never told to check in.
 */
async function mentorNudges(
  rules: NotificationRules,
  now: Date,
): Promise<number> {
  const pairs = await activePairs();
  const quietSince = new Date(now.getTime() - rules.mentorNudgeDays * DAY_MS);
  const menteeAwaySince = new Date(
    now.getTime() - rules.mentorInactiveDays * DAY_MS,
  );

  let sent = 0;
  for (const pair of pairs) {
    if (!pair.mentorId || !pair.menteeId) continue;

    const vars = {
      mentee: pair.menteeName ?? "your mentee",
      mentorshipId: pair.mentorshipId,
      menteeId: pair.menteeId,
    };

    // The mentee has gone quiet — the more urgent of the two, so it wins when
    // both would apply. Skipped when lastActiveAt is unknown, for the same
    // reason menteeInactivity() skips it.
    if (pair.menteeLastActive && pair.menteeLastActive < menteeAwaySince) {
      const result = await dispatch({
        key: "MENTEE_INACTIVE",
        to: pair.mentorId,
        vars,
      });
      sent += result.persisted;
      continue;
    }

    // A mentorship accepted three days ago has not "gone quiet"; give the pair
    // the full window before suggesting the mentor is neglecting it.
    if (pair.startedAt && pair.startedAt > quietSince) continue;
    if (pair.lastMentorMessageAt && pair.lastMentorMessageAt > quietSince) {
      continue;
    }

    const result = await dispatch({
      key: "MENTOR_CHECK_IN_PROMPT",
      to: pair.mentorId,
      vars,
    });
    sent += result.persisted;
  }
  return sent;
}

/**
 * Tell a mentor when their mentee has met the pacing and task floor.
 *
 * Promotion is mentor-only and there is no screen that surfaces readiness
 * except the mentee's own portal page, so without this a mentee can sit ready
 * to advance for weeks because nobody happened to look.
 */
async function stageReady(): Promise<number> {
  const pairs = await activePairs();

  let sent = 0;
  for (const pair of pairs) {
    if (!pair.mentorId || !pair.menteeId) continue;

    const readiness = await getStageReadiness(pair.menteeId);
    if (!readiness.ready) continue;

    const result = await dispatch({
      key: "STAGE_READY",
      to: pair.mentorId,
      vars: {
        mentee: pair.menteeName ?? "Your mentee",
        menteeId: pair.menteeId,
      },
      // One announcement per mentee per stage, however long they sit ready.
      dedupe: `${pair.menteeId}:ready:${readiness.stage}`,
    });
    sent += result.persisted;
  }
  return sent;
}

// ---------------------------------------------------------------------------
// Weekly summaries
// ---------------------------------------------------------------------------

/**
 * The week in review, for both sides.
 *
 * Runs on one weekday only. Nobody with an empty week receives one: a summary
 * that reads "0 milestones, 0 activities" is not encouragement, and sending it
 * every Sunday to someone who has drifted away is the exact behaviour the
 * no-spam rule exists to prevent. The inactivity nudge is what that person
 * gets instead.
 */
async function weeklySummaries(
  rules: NotificationRules,
  now: Date,
): Promise<number> {
  if (now.getUTCDay() !== rules.weeklySummaryWeekday) return 0;

  const since = new Date(now.getTime() - 7 * DAY_MS);
  const week = isoWeek(now);

  const [milestoneCounts, taskCounts, journalCounts] = await Promise.all([
    db
      .select({ menteeId: skillTracks.menteeId, n: count() })
      .from(skillMilestones)
      .innerJoin(skillTracks, eq(skillMilestones.skillTrackId, skillTracks.id))
      .where(
        and(
          eq(skillMilestones.status, "done"),
          gte(skillMilestones.completedAt, since),
        ),
      )
      .groupBy(skillTracks.menteeId),
    db
      .select({ menteeId: mentorships.menteeId, n: count() })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .where(and(eq(tasks.status, "completed"), gte(tasks.completedAt, since)))
      .groupBy(mentorships.menteeId),
    db
      .select({ userId: journalEntries.userId, n: count() })
      .from(journalEntries)
      .where(gte(journalEntries.createdAt, since))
      .groupBy(journalEntries.userId),
  ]);

  const tally = new Map<
    string,
    { milestones: number; tasks: number; journals: number }
  >();
  const bump = (
    id: string | null,
    field: "milestones" | "tasks" | "journals",
    n: number,
  ) => {
    if (!id || n === 0) return;
    const row = tally.get(id) ?? { milestones: 0, tasks: 0, journals: 0 };
    row[field] += n;
    tally.set(id, row);
  };

  for (const r of milestoneCounts) bump(r.menteeId, "milestones", Number(r.n));
  for (const r of taskCounts) bump(r.menteeId, "tasks", Number(r.n));
  for (const r of journalCounts) bump(r.userId, "journals", Number(r.n));

  if (tally.size === 0) return 0;

  let sent = 0;

  // Mentees hear about their own week.
  for (const [menteeId, counts] of tally) {
    const summary = summariseWeek(counts);
    if (!summary) continue;
    const result = await dispatch({
      key: "MENTEE_WEEKLY_SUMMARY",
      to: menteeId,
      vars: { summary },
      dedupe: `${menteeId}:week:${week}`,
    });
    sent += result.persisted;
  }

  // Mentors hear about their mentee's week — and only if there was one.
  for (const pair of await activePairs()) {
    if (!pair.mentorId || !pair.menteeId) continue;
    const counts = tally.get(pair.menteeId);
    if (!counts) continue;
    const summary = summariseWeek(counts);
    if (!summary) continue;

    const result = await dispatch({
      key: "MENTOR_WEEKLY_SUMMARY",
      to: pair.mentorId,
      vars: {
        summary: `${pair.menteeName ?? "Your mentee"}: ${summary} Don't forget to check in.`,
      },
      dedupe: `${pair.mentorId}:week:${week}:${pair.menteeId}`,
    });
    sent += result.persisted;
  }

  return sent;
}

/** `2026-W36` — stable within a week, so a summary can be deduped on it. */
function isoWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Thursday of the current ISO week determines the year the week belongs to.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
