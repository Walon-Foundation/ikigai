import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import {
  mentorships,
  milestoneTemplates,
  skillCategories,
  skillMilestones,
  skillTracks,
} from "@/db/schema";
import type { DbUser } from "@/lib/db-user";
import { applyTaskComplete } from "@/lib/growth-tree";
import { classifySkillTag } from "@/lib/skill-classifier";
import {
  nextSkillStage,
  SKILL_STAGES,
  type SkillStage,
} from "@/lib/skill-stages";

export type SkillMilestoneView = {
  id: string;
  label: string;
  dimension: string;
  stage: SkillStage;
  requiresMentorReview: boolean;
  growthPoints: number;
  status: "locked" | "available" | "submitted" | "done";
  mentorFeedback: string | null;
};

export type SkillTrackView = {
  id: string;
  interestTag: string;
  categoryName: string;
  currentStage: SkillStage;
  milestones: SkillMilestoneView[];
  completedCount: number;
  totalCount: number;
};

/**
 * Ensure a skillTrack (+ its instantiated milestones) exists for every one of
 * the mentee's interestTags, then return all tracks hydrated for display.
 *
 * Lazy instead of generated at onboarding: interestTags can change any time
 * from Settings, so "does this tag have a track yet" has to be checked on
 * read regardless. Everything here is batched to a handful of round trips
 * total, not per-skill, since the Neon HTTP driver pays a network round trip
 * per statement and a mentee may track several skills at once.
 */
export async function getOrCreateSkillTracks(
  user: DbUser,
): Promise<SkillTrackView[]> {
  const tags = [...new Set((user.interestTags ?? []).filter(Boolean))];
  if (tags.length === 0) return [];

  const [existingTracks, categories] = await Promise.all([
    db.select().from(skillTracks).where(eq(skillTracks.menteeId, user.id)),
    db.select().from(skillCategories),
  ]);

  const trackedTags = new Set(existingTracks.map((t) => t.interestTag));
  const missingTags = tags.filter((tag) => !trackedTags.has(tag));

  let newTracks: (typeof existingTracks)[number][] = [];
  if (missingTags.length > 0) {
    const [activeMentorship] = await db
      .select({ id: mentorships.id })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, user.id),
          eq(mentorships.status, "active"),
        ),
      )
      .limit(1);

    const toInsert = missingTags
      .map((tag) => ({
        tag,
        categoryId: classifySkillTag(tag, categories),
      }))
      // No categories seeded yet (fresh install) — nothing to generate.
      .filter((v): v is { tag: string; categoryId: string } => !!v.categoryId)
      .map((v) => ({
        menteeId: user.id,
        interestTag: v.tag,
        categoryId: v.categoryId,
        mentorshipId: activeMentorship?.id ?? null,
      }));

    if (toInsert.length > 0) {
      newTracks = await db
        .insert(skillTracks)
        .values(toInsert)
        .onConflictDoNothing({
          target: [skillTracks.menteeId, skillTracks.interestTag],
        })
        .returning();
    }
  }

  const tracks = [...existingTracks, ...newTracks];
  if (tracks.length === 0) return [];

  const categoryIds = [...new Set(tracks.map((t) => t.categoryId))];
  const trackIds = tracks.map((t) => t.id);

  const [templates, existingMilestones] = await Promise.all([
    db
      .select()
      .from(milestoneTemplates)
      .where(inArray(milestoneTemplates.categoryId, categoryIds)),
    db
      .select()
      .from(skillMilestones)
      .where(inArray(skillMilestones.skillTrackId, trackIds)),
  ]);

  const templatesByCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const list = templatesByCategory.get(t.categoryId) ?? [];
    list.push(t);
    templatesByCategory.set(t.categoryId, list);
  }

  const instantiatedIds = new Set(
    existingMilestones.map((m) => `${m.skillTrackId}:${m.templateId}`),
  );

  const toInstantiate: (typeof skillMilestones.$inferInsert)[] = [];
  for (const track of tracks) {
    const currentIndex = SKILL_STAGES.indexOf(track.currentStage as SkillStage);
    for (const template of templatesByCategory.get(track.categoryId) ?? []) {
      if (instantiatedIds.has(`${track.id}:${template.id}`)) continue;
      const stageIndex = SKILL_STAGES.indexOf(template.stage as SkillStage);
      toInstantiate.push({
        skillTrackId: track.id,
        templateId: template.id,
        status: stageIndex <= currentIndex ? "available" : "locked",
      });
    }
  }

  let newMilestones: typeof existingMilestones = [];
  if (toInstantiate.length > 0) {
    newMilestones = await db
      .insert(skillMilestones)
      .values(toInstantiate)
      .onConflictDoNothing({
        target: [skillMilestones.skillTrackId, skillMilestones.templateId],
      })
      .returning();
  }

  const allMilestones = [...existingMilestones, ...newMilestones];
  const templatesById = new Map(templates.map((t) => [t.id, t]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  return tracks
    .map((track): SkillTrackView => {
      const milestones = allMilestones
        .filter((m) => m.skillTrackId === track.id)
        .map((m) => {
          const template = templatesById.get(m.templateId);
          return {
            id: m.id,
            label: template?.label ?? "",
            dimension: template?.dimension ?? "",
            stage: (template?.stage ?? "discover") as SkillStage,
            requiresMentorReview: template?.requiresMentorReview ?? false,
            growthPoints: template?.growthPoints ?? 0,
            status: m.status as SkillMilestoneView["status"],
            mentorFeedback: m.mentorFeedback,
            orderIndex: template?.orderIndex ?? 0,
          };
        })
        .sort(
          (a, b) =>
            SKILL_STAGES.indexOf(a.stage) - SKILL_STAGES.indexOf(b.stage) ||
            a.orderIndex - b.orderIndex,
        )
        .map(({ orderIndex, ...rest }) => rest);

      return {
        id: track.id,
        interestTag: track.interestTag,
        categoryName: categoriesById.get(track.categoryId)?.name ?? "Skill",
        currentStage: track.currentStage as SkillStage,
        milestones,
        completedCount: milestones.filter((m) => m.status === "done").length,
        totalCount: milestones.length,
      };
    })
    .sort((a, b) => a.interestTag.localeCompare(b.interestTag));
}

/** Advance a track's stage once every milestone in its current stage is done. */
async function maybeAdvanceStage(skillTrackId: string): Promise<void> {
  const [track] = await db
    .select()
    .from(skillTracks)
    .where(eq(skillTracks.id, skillTrackId))
    .limit(1);
  if (!track) return;

  const currentStage = track.currentStage as SkillStage;
  const milestones = await db
    .select({
      status: skillMilestones.status,
      templateId: skillMilestones.templateId,
    })
    .from(skillMilestones)
    .where(eq(skillMilestones.skillTrackId, skillTrackId));

  const templates = await db
    .select({ id: milestoneTemplates.id, stage: milestoneTemplates.stage })
    .from(milestoneTemplates)
    .where(eq(milestoneTemplates.categoryId, track.categoryId));
  const stageByTemplate = new Map(templates.map((t) => [t.id, t.stage]));

  const currentStageMilestones = milestones.filter(
    (m) => stageByTemplate.get(m.templateId) === currentStage,
  );
  const allDone =
    currentStageMilestones.length > 0 &&
    currentStageMilestones.every((m) => m.status === "done");
  if (!allDone) return;

  const next = nextSkillStage(currentStage);
  if (!next) return;

  await db
    .update(skillTracks)
    .set({ currentStage: next, updatedAt: new Date() })
    .where(eq(skillTracks.id, skillTrackId));

  // Unlock whatever was waiting on the new stage.
  const toUnlock = milestones
    .filter((m) => stageByTemplate.get(m.templateId) === next)
    .map((m) => m.templateId);
  if (toUnlock.length === 0) return;

  await db
    .update(skillMilestones)
    .set({ status: "available" })
    .where(
      and(
        eq(skillMilestones.skillTrackId, skillTrackId),
        inArray(skillMilestones.templateId, toUnlock),
        eq(skillMilestones.status, "locked"),
      ),
    );
}

async function loadOwnedMilestone(milestoneId: string, menteeId: string) {
  const [row] = await db
    .select({
      milestone: skillMilestones,
      template: milestoneTemplates,
      track: skillTracks,
    })
    .from(skillMilestones)
    .innerJoin(
      milestoneTemplates,
      eq(skillMilestones.templateId, milestoneTemplates.id),
    )
    .innerJoin(skillTracks, eq(skillMilestones.skillTrackId, skillTracks.id))
    .where(
      and(
        eq(skillMilestones.id, milestoneId),
        eq(skillTracks.menteeId, menteeId),
      ),
    )
    .limit(1);
  return row;
}

/** A mentee checks off a self-checkable milestone (no mentor review needed). */
export async function completeOwnMilestone(
  milestoneId: string,
  menteeId: string,
): Promise<void> {
  const row = await loadOwnedMilestone(milestoneId, menteeId);
  if (!row || row.milestone.status !== "available") return;
  if (row.template.requiresMentorReview) {
    throw new Error("This milestone needs your mentor to review it first");
  }

  await db
    .update(skillMilestones)
    .set({ status: "done", completedAt: new Date() })
    .where(
      and(
        eq(skillMilestones.id, milestoneId),
        eq(skillMilestones.status, "available"),
      ),
    );
  await applyTaskComplete(menteeId, row.template.growthPoints);
  await maybeAdvanceStage(row.track.id);
}

/** A mentee submits work on a milestone that needs mentor sign-off. */
export async function submitOwnMilestone(
  milestoneId: string,
  menteeId: string,
): Promise<void> {
  const row = await loadOwnedMilestone(milestoneId, menteeId);
  if (!row || row.milestone.status !== "available") return;

  await db
    .update(skillMilestones)
    .set({ status: "submitted", submittedAt: new Date(), mentorFeedback: null })
    .where(
      and(
        eq(skillMilestones.id, milestoneId),
        eq(skillMilestones.status, "available"),
      ),
    );
}

/** A mentor reviews a submitted milestone: approve (awards points) or send back with feedback. */
export async function reviewMilestone(
  milestoneId: string,
  mentorId: string,
  decision: "approve" | "revise",
  feedback: string | null,
): Promise<void> {
  const [row] = await db
    .select({
      milestone: skillMilestones,
      template: milestoneTemplates,
      track: skillTracks,
    })
    .from(skillMilestones)
    .innerJoin(
      milestoneTemplates,
      eq(skillMilestones.templateId, milestoneTemplates.id),
    )
    .innerJoin(skillTracks, eq(skillMilestones.skillTrackId, skillTracks.id))
    .innerJoin(mentorships, eq(skillTracks.mentorshipId, mentorships.id))
    .where(
      and(
        eq(skillMilestones.id, milestoneId),
        eq(mentorships.mentorId, mentorId),
        eq(mentorships.status, "active"),
      ),
    )
    .limit(1);

  if (!row || row.milestone.status !== "submitted") return;

  if (decision === "approve") {
    await db
      .update(skillMilestones)
      .set({
        status: "done",
        completedAt: new Date(),
        mentorFeedback: feedback,
      })
      .where(
        and(
          eq(skillMilestones.id, milestoneId),
          eq(skillMilestones.status, "submitted"),
        ),
      );
    await applyTaskComplete(row.track.menteeId, row.template.growthPoints);
    await maybeAdvanceStage(row.track.id);
  } else {
    await db
      .update(skillMilestones)
      .set({ status: "available", mentorFeedback: feedback })
      .where(
        and(
          eq(skillMilestones.id, milestoneId),
          eq(skillMilestones.status, "submitted"),
        ),
      );
  }
}
