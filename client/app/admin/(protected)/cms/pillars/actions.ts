"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { pillars } from "@/db/schema";
import { requiredText, slugify, text } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/pillars";
const cols = {
  table: pillars,
  id: pillars.id,
  orderIndex: pillars.orderIndex,
  published: pillars.published,
};
const ACCENTS = ["green", "amber", "earth", "sage"];

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const name = requiredText(v.name, 120, "Name");
  const accent = ACCENTS.includes(v.accent ?? "") ? v.accent : "green";
  const fields = {
    name,
    tagline: text(v.tagline, 200),
    description: text(v.description, 1_000),
    icon: text(v.icon, 8),
    accent,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(pillars).set(fields).where(eq(pillars.id, id));
  } else {
    await db.insert(pillars).values({
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
