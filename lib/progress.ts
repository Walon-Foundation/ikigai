import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db/db";
import {
  eventAttendance,
  journalEntries,
  meetingVerifications,
  mentorships,
  milestones,
  tasks,
} from "@/db/schema";
import type { DbUser } from "@/lib/db-user";
import {
  evaluateRoadmap,
  type RoadmapResult,
  type Signals,
} from "@/lib/roadmap";

type OnboardingData = {
  purposeProfile?: { statement?: string };
  lifeVision?: string;
} | null;

// Gather the signals the roadmap is computed from. Derived from existing data
// (no separate progress table), so it reflects everything the mentee has done
// without a backfill step.
export async function getMenteeProgress(user: DbUser): Promise<RoadmapResult> {
  const [
    [{ journals }],
    [{ completed }],
    [{ active }],
    safetyRows,
    [{ attended }],
    [{ meetings }],
  ] = await Promise.all([
    db
      .select({ journals: count() })
      .from(journalEntries)
      .where(eq(journalEntries.userId, user.id)),
    db
      .select({ completed: count() })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .where(
        and(eq(mentorships.menteeId, user.id), eq(tasks.status, "completed")),
      ),
    db
      .select({ active: count() })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, user.id),
          eq(mentorships.status, "active"),
        ),
      ),
    db
      .select({ type: milestones.type })
      .from(milestones)
      .where(eq(milestones.userId, user.id)),
    db
      .select({ attended: count() })
      .from(eventAttendance)
      .where(
        and(
          eq(eventAttendance.userId, user.id),
          eq(eventAttendance.status, "attended"),
        ),
      ),
    db
      .select({ meetings: count() })
      .from(meetingVerifications)
      .innerJoin(
        mentorships,
        eq(meetingVerifications.mentorshipId, mentorships.id),
      )
      .where(eq(mentorships.menteeId, user.id)),
  ]);

  const data = (user.onboardingData as OnboardingData) ?? null;
  const milestoneTypes = new Set(safetyRows.map((r) => r.type));

  const signals: Signals = {
    assessmentDone:
      milestoneTypes.has("purpose_quiz") || !!data?.purposeProfile,
    hasPurposeStatement: !!data?.purposeProfile?.statement,
    hasLifeVision: !!data?.lifeVision && data.lifeVision.trim().length > 0,
    hasMentor: Number(active) > 0,
    journalCount: Number(journals),
    completedTasks: Number(completed),
    safetyDone: milestoneTypes.has("safety_module"),
    eventsAttended: Number(attended),
    meetingsVerified: Number(meetings),
  };

  return evaluateRoadmap(signals);
}
