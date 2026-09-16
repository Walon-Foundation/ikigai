import "server-only";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import { groupMembers, groups, users } from "@/db/schema";
import { SKILL_STAGES, type SkillStage } from "@/lib/skill-stages";

// Club discovery: which clubs to put in front of a mentee, and why.
//
// Clubs and mentees describe themselves in the SAME open vocabulary —
// groups.interestTags and users.interestTags are both free text a person typed
// — which is what makes them comparable at all. This is the same premise
// lib/match.ts runs on for mentor matching, and the scoring below is
// deliberately the same shape so the two never disagree about what "a good
// match" means.

/** Weight of a shared interest tag, as a share of the final score. */
const TAG_WEIGHT = 70;
/** Weight of the stage fit. */
const STAGE_WEIGHT = 30;

function normalize(tags: string[] | null | undefined): Set<string> {
  return new Set(
    (tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
  );
}

/** A URL-safe slug, uniquified by the caller. */
export function slugifyClubName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  // A name of nothing but punctuation or non-Latin script slugifies to an
  // empty string, and an empty slug would collide with every other one.
  return base || "club";
}

/**
 * Reserve a unique slug for a club name.
 *
 * Checks and appends a counter rather than trusting the first candidate: two
 * mentees naming their club "Coding Club" is the expected case, not an edge
 * one. The unique index on groups.slug is still the authority — this only
 * keeps the common case from reaching it as an error.
 */
export async function reserveClubSlug(name: string): Promise<string> {
  const base = slugifyClubName(name);
  const taken = new Set(
    (await db.select({ slug: groups.slug }).from(groups)).map((g) => g.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; n < 500; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Falls back to something unique-by-construction rather than looping forever.
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export type ClubRecommendation = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  interestTags: string[];
  stage: SkillStage | null;
  memberCount: number;
  score: number;
  /** Why this club was recommended, shown to the mentee. */
  reason: string;
};

/**
 * Score one club against one mentee. Pure — no database, so it is testable and
 * cheap enough to run over every club in the list.
 *
 * Stage fit is graded, not binary: a club for the stage you are about to enter
 * is a better recommendation than one three stages away, and a club that names
 * no stage suits anyone and scores neutrally rather than zero.
 */
export function scoreClub(
  menteeTags: string[] | null | undefined,
  menteeStage: SkillStage,
  club: { interestTags: string[] | null; stage: SkillStage | null },
): { score: number; sharedTags: string[] } {
  const mine = normalize(menteeTags);
  const theirs = normalize(club.interestTags);

  const shared = [...theirs].filter((t) => mine.has(t));
  // Scored against the CLUB's tags, not the mentee's: a club about one thing
  // the mentee cares about is a strong match for that thing, and dividing by
  // the mentee's tag count would penalise it for every unrelated interest they
  // happen to have listed.
  const tagScore =
    theirs.size === 0
      ? TAG_WEIGHT * 0.3
      : (shared.length / theirs.size) * TAG_WEIGHT;

  let stageScore: number;
  if (!club.stage) {
    stageScore = STAGE_WEIGHT * 0.5; // open to any stage
  } else {
    const distance = Math.abs(
      SKILL_STAGES.indexOf(club.stage) - SKILL_STAGES.indexOf(menteeStage),
    );
    stageScore = Math.max(0, STAGE_WEIGHT * (1 - distance / 3));
  }

  return { score: Math.round(tagScore + stageScore), sharedTags: shared };
}

function reasonFor(
  sharedTags: string[],
  clubStage: SkillStage | null,
  menteeStage: SkillStage,
): string {
  if (sharedTags.length > 0) {
    const listed = sharedTags.slice(0, 2).join(" and ");
    return `Matches your interest in ${listed}`;
  }
  if (clubStage === menteeStage) {
    return `Built for mentees at the ${menteeStage} stage`;
  }
  return "Popular with mentees like you";
}

/**
 * Clubs to recommend to a mentee, best first.
 *
 * Excludes clubs they are already in — a recommendation to join something you
 * joined last week is noise, and it is the single most common way a
 * recommendation list loses a user's trust.
 */
export async function recommendClubs(
  menteeId: string,
  limit = 4,
): Promise<ClubRecommendation[]> {
  const [mentee] = await db
    .select({
      interestTags: users.interestTags,
      currentStage: users.currentStage,
    })
    .from(users)
    .where(eq(users.id, menteeId))
    .limit(1);
  if (!mentee) return [];

  const [visible, mine] = await Promise.all([
    db
      .select({
        id: groups.id,
        name: groups.name,
        slug: groups.slug,
        description: groups.description,
        interestTags: groups.interestTags,
        stage: groups.stage,
        createdAt: groups.createdAt,
      })
      .from(groups)
      .where(isNull(groups.hiddenAt)),
    db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, menteeId)),
  ]);

  const joined = new Set(mine.map((m) => m.groupId));
  const candidates = visible.filter((c) => !joined.has(c.id));
  if (candidates.length === 0) return [];

  const counts = await memberCounts(candidates.map((c) => c.id));
  const menteeStage = (mentee.currentStage ?? "discover") as SkillStage;

  return candidates
    .map((club): ClubRecommendation => {
      const stage = (club.stage ?? null) as SkillStage | null;
      const { score, sharedTags } = scoreClub(
        mentee.interestTags,
        menteeStage,
        { interestTags: club.interestTags, stage },
      );
      return {
        id: club.id,
        name: club.name,
        slug: club.slug,
        description: club.description,
        interestTags: club.interestTags ?? [],
        stage,
        memberCount: counts.get(club.id) ?? 0,
        score,
        reason: reasonFor(sharedTags, stage, menteeStage),
      };
    })
    .sort((a, b) => b.score - a.score || b.memberCount - a.memberCount)
    .slice(0, limit);
}

/**
 * Member counts for a set of clubs, in one round trip.
 *
 * Counted in the database rather than by reading group_members and tallying in
 * JS: the membership table grows with every join on the platform, and the
 * public clubs page would otherwise pull all of it on every render.
 */
async function memberCounts(clubIds: string[]): Promise<Map<string, number>> {
  if (clubIds.length === 0) return new Map();
  const rows = await db
    .select({ groupId: groupMembers.groupId, value: count() })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, clubIds))
    .groupBy(groupMembers.groupId);
  return new Map(rows.map((r) => [r.groupId, Number(r.value)]));
}

/** Clubs for the public website: visible, newest first. */
export async function getPublicClubs(limit = 60) {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      description: groups.description,
      interestTags: groups.interestTags,
      stage: groups.stage,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .where(isNull(groups.hiddenAt))
    .orderBy(desc(groups.createdAt))
    .limit(limit);

  const counts = await memberCounts(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, memberCount: counts.get(r.id) ?? 0 }));
}

/** One club for its public page, or null if it does not exist or is hidden. */
export async function getPublicClub(slug: string) {
  const [row] = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      description: groups.description,
      interestTags: groups.interestTags,
      stage: groups.stage,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .where(and(eq(groups.slug, slug), isNull(groups.hiddenAt)))
    .limit(1);
  if (!row) return null;
  const counts = await memberCounts([row.id]);
  return { ...row, memberCount: counts.get(row.id) ?? 0 };
}
