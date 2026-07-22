"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { stories } from "@/db/schema";
import { requiredText, slugify, text } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/stories";
const cols = {
  table: stories,
  id: stories.id,
  orderIndex: stories.orderIndex,
  published: stories.published,
};
const CATEGORIES = ["participant", "volunteer", "partner", "impact"];

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const title = requiredText(v.title, 200, "Title");
  const category = CATEGORIES.includes(v.category ?? "")
    ? v.category
    : "impact";
  const fields = {
    title,
    category,
    excerpt: text(v.excerpt, 400),
    body: text(v.body, 20_000),
    coverImageUrl: text(v.coverImageUrl, 500),
    authorName: text(v.authorName, 120),
    programmeId: v.programmeId || null,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(stories).set(fields).where(eq(stories.id, id));
  } else {
    await db.insert(stories).values({
      ...fields,
      slug: slugify(title),
      // Set at authoring time so the public list (ordered by publishedAt) has a
      // stable key. The row still stays hidden until `published` is flipped.
      publishedAt: new Date(),
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
