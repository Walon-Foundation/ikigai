"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { programmes } from "@/db/schema";
import { bool, lines, requiredText, slugify, text } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/programmes";
const cols = {
  table: programmes,
  id: programmes.id,
  orderIndex: programmes.orderIndex,
  published: programmes.published,
};

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const name = requiredText(v.name, 120, "Name");
  const fields = {
    name,
    pillarId: v.pillarId || null,
    summary: text(v.summary, 300),
    heroImageUrl: text(v.heroImageUrl, 500),
    about: text(v.about, 4_000),
    objectives: lines(v.objectives),
    activities: lines(v.activities),
    impactValue: text(v.impactValue, 40),
    impactLabel: text(v.impactLabel, 80),
    ctaLabel: text(v.ctaLabel, 60),
    ctaUrl: text(v.ctaUrl, 300),
    featured: bool(v.featured),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(programmes).set(fields).where(eq(programmes.id, id));
  } else {
    await db.insert(programmes).values({
      ...fields,
      slug: slugify(name),
      orderIndex: await nextOrderIndex(cols),
    });
  }
  cmsInvalidate(PATH);
}

export async function remove(id: string) {
  await cmsRemove(cols, PATH, id);
}
export async function togglePublish(id: string, next: boolean) {
  await cmsTogglePublish(cols, PATH, id, next);
}
export async function move(id: string, dir: "up" | "down") {
  await cmsMove(cols, PATH, id, dir);
}
