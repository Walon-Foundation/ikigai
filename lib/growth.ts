// Pure growth-tree maths — no database, safe to import anywhere.
//
// The tree has two independent dials:
//   - growthPoints / stage: permanent. Only ever increase. This is the size the
//     mentee has earned by completing tasks.
//   - health (0–100): transient. Falls when tasks fail, recovers when tasks
//     complete. This is the "wilt vs. thrive" vitality of the plant.

export const STAGE_THRESHOLDS = [0, 30, 80, 150, 250] as const;
export const STAGE_NAMES = [
  "Seed",
  "Sprout",
  "Sapling",
  "Young Tree",
  "Flourishing",
] as const;

export const DEFAULT_TASK_POINTS = 10;
export const TASK_COMPLETE_HEALTH = 10; // health recovered per completed task
export const TASK_FAIL_HEALTH = 20; // health lost per failed task
export const WILT_THRESHOLD = 50; // below this, the plant visibly wilts

export function stageForPoints(points: number): number {
  let stage = 1;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (points >= STAGE_THRESHOLDS[i]) stage = i + 1;
  }
  return stage;
}

export function stageName(stage: number): string {
  return STAGE_NAMES[stage - 1] ?? STAGE_NAMES[0];
}

export function clampHealth(health: number): number {
  return Math.max(0, Math.min(100, health));
}

// Points needed to reach the next stage, and progress toward it (0–1). Returns
// null progress when already at the final stage.
export function nextStageProgress(points: number): {
  current: number;
  next: number | null;
  progress: number;
} {
  const stage = stageForPoints(points);
  const next = STAGE_THRESHOLDS[stage] ?? null; // threshold for the next stage
  if (next === null) return { current: stage, next: null, progress: 1 };
  const floor = STAGE_THRESHOLDS[stage - 1];
  return {
    current: stage,
    next,
    progress: (points - floor) / (next - floor),
  };
}
