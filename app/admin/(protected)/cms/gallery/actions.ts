"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { galleryItems } from "@/db/schema";
import { requiredText, text } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/gallery";
const cols = {
  table: galleryItems,
  id: galleryItems.id,
  orderIndex: galleryItems.orderIndex,
  published: galleryItems.published,
};

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const album = requiredText(v.album, 120, "Album");
  const imageUrl = requiredText(v.imageUrl, 500, "Image");
  const fields = {
    album,
    imageUrl,
    caption: text(v.caption, 300),
    programmeId: v.programmeId || null,
  };

  if (id) {
    await db.update(galleryItems).set(fields).where(eq(galleryItems.id, id));
  } else {
    await db
      .insert(galleryItems)
      .values({ ...fields, orderIndex: await nextOrderIndex(cols) });
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
