// The universal growth framework every skill track follows. Pure — no
// database — shared by lib/skill-tracks.ts and the Journey UI.

export const SKILL_STAGES = ["discover", "thrive", "build", "lead"] as const;

export type SkillStage = (typeof SKILL_STAGES)[number];

export const SKILL_STAGE_LABELS: Record<SkillStage, string> = {
  discover: "Discover",
  thrive: "Thrive",
  build: "Build",
  lead: "Lead",
};

export function nextSkillStage(stage: SkillStage): SkillStage | null {
  const i = SKILL_STAGES.indexOf(stage);
  return i >= 0 && i < SKILL_STAGES.length - 1 ? SKILL_STAGES[i + 1] : null;
}
