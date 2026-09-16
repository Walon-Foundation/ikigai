import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { growthTrees } from "@/db/schema";
import {
  clampHealth,
  stageForPoints,
  TASK_COMPLETE_HEALTH,
  TASK_FAIL_HEALTH,
} from "@/lib/growth";

export type GrowthTree = typeof growthTrees.$inferSelect;

// Read the mentee's tree, creating it on first access. The Neon HTTP driver is
// stateless (no interactive transactions), so we upsert and read back.
export async function getOrCreateTree(userId: string): Promise<GrowthTree> {
  const [existing] = await db
    .select()
    .from(growthTrees)
    .where(eq(growthTrees.userId, userId))
    .limit(1);
  if (existing) return existing;

  await db
    .insert(growthTrees)
    .values({ userId })
    .onConflictDoNothing({ target: growthTrees.userId });

  const [row] = await db
    .select()
    .from(growthTrees)
    .where(eq(growthTrees.userId, userId))
    .limit(1);
  return row;
}

// A completed task: permanent growth (points + stage) and recovered health.
export async function applyTaskComplete(
  userId: string,
  points: number,
): Promise<GrowthTree> {
  const tree = await getOrCreateTree(userId);
  const growthPoints = tree.growthPoints + points;
  const stage = stageForPoints(growthPoints);
  const health = clampHealth(tree.health + TASK_COMPLETE_HEALTH);

  const [updated] = await db
    .update(growthTrees)
    .set({ growthPoints, stage, health, updatedAt: new Date() })
    .where(eq(growthTrees.userId, userId))
    .returning();
  return updated;
}

// A failed task: the plant wilts (health drops). Earned size is never lost.
export async function applyTaskFail(userId: string): Promise<GrowthTree> {
  const tree = await getOrCreateTree(userId);
  const health = clampHealth(tree.health - TASK_FAIL_HEALTH);

  const [updated] = await db
    .update(growthTrees)
    .set({ health, updatedAt: new Date() })
    .where(eq(growthTrees.userId, userId))
    .returning();
  return updated;
}
