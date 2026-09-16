// Similarity scoring for mentor↔mentee matching. Pure — no database.
//
// Score is the share of the mentee's interests the mentor also covers, scaled
// to 0–100, with a small floor so a brand-new mentee with no overlap still sees
// a sensible number. Case-insensitive, tolerant of spacing.

export const MENTOR_CAPACITY = 2; // max active mentees per mentor
const SCORE_FLOOR = 40;

function normalize(tags: string[] | null | undefined): Set<string> {
  return new Set(
    (tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
  );
}

export function matchScore(
  menteeTags: string[] | null | undefined,
  mentorTags: string[] | null | undefined,
): number {
  const mentee = normalize(menteeTags);
  const mentor = normalize(mentorTags);
  if (mentee.size === 0 || mentor.size === 0) return SCORE_FLOOR;

  let shared = 0;
  for (const tag of mentee) if (mentor.has(tag)) shared += 1;

  const ratio = shared / mentee.size;
  return Math.round(SCORE_FLOOR + ratio * (100 - SCORE_FLOOR));
}
