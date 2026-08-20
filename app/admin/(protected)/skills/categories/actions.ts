"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { skillCategories } from "@/db/schema";
import {
  bool,
  lines,
  moveInOrder,
  requiredText,
  slugify,
  text,
} from "@/lib/cms-admin";
import { cmsInvalidate, cmsRemove, nextOrderIndex } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/skills/categories";
const cols = {
  table: skillCategories,
  id: skillCategories.id,
  orderIndex: skillCategories.orderIndex,
};

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const name = requiredText(v.name, 120, "Name");
  const fields = {
    name,
    description: text(v.description, 600),
    aliases: lines(v.aliases, 30, 60),
    isFallback: bool(v.isFallback),
    updatedAt: new Date(),
  };

  if (id) {
    await db
      .update(skillCategories)
      .set(fields)
      .where(eq(skillCategories.id, id));
  } else {
    await db.insert(skillCategories).values({
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

export async function move(id: string, dir: "up" | "down") {
  await requireAdmin();
  const rows = await db
    .select({ id: skillCategories.id })
    .from(skillCategories)
    .orderBy(asc(skillCategories.orderIndex));

  await moveInOrder({
    rows,
    id,
    dir,
    apply: (rowId, orderIndex) =>
      db
        .update(skillCategories)
        .set({ orderIndex })
        .where(eq(skillCategories.id, rowId))
        .then(() => undefined),
  });
  cmsInvalidate(PATH);
}
