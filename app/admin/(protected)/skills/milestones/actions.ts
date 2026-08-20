"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { milestoneTemplates } from "@/db/schema";
import { bool, int, requiredText, text } from "@/lib/cms-admin";
import { cmsInvalidate, cmsRemove } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";
import { SKILL_STAGES, type SkillStage } from "@/lib/skill-stages";

const PATH = "/admin/skills/milestones";
const cols = { table: milestoneTemplates, id: milestoneTemplates.id };

const DIMENSIONS = [
  "knowledge",
  "tools",
  "practice",
  "output",
  "feedback",
  "real_world",
  "impact",
];

function stage(value: string | undefined): SkillStage {
  return (SKILL_STAGES as readonly string[]).includes(value ?? "")
    ? (value as SkillStage)
    : "discover";
}

export async function save(
  categoryId: string,
  id: string | null,
  v: Record<string, string>,
) {
  await requireAdmin();
  const label = requiredText(v.label, 300, "Label");
  const fields = {
    label,
    stage: stage(v.stage),
    dimension: DIMENSIONS.includes(v.dimension) ? v.dimension : "practice",
    requiresMentorReview: bool(v.requiresMentorReview),
    growthPoints: int(v.growthPoints, 10, 0, 200),
    orderIndex: int(v.orderIndex, 0, 0, 999),
    updatedAt: new Date(),
  };

  if (id) {
    await db
      .update(milestoneTemplates)
      .set(fields)
      .where(eq(milestoneTemplates.id, id));
  } else {
    const cat = text(categoryId, 100);
    if (!cat) throw new Error("Missing category");
    await db.insert(milestoneTemplates).values({ ...fields, categoryId: cat });
  }
  cmsInvalidate(PATH);
}

export async function remove(id: string) {
  await cmsRemove(cols, PATH, id);
}
