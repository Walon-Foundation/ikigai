"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { pageBlocks } from "@/db/schema";
import { BLOCK_REGISTRY, isBlockType } from "@/lib/blocks/registry";
import { cmsInvalidate, cmsRemove, cmsTogglePublish } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/page-builder";
const cols = {
  table: pageBlocks,
  id: pageBlocks.id,
  published: pageBlocks.published,
};

export async function addBlock(page: string, type: string) {
  await requireAdmin();
  if (typeof page !== "string" || !page) throw new Error("Invalid page");
  if (!isBlockType(type)) throw new Error("Unknown block type");

  // Scoped to this page: page_blocks will eventually hold rows for more than
  // one route, and a global max would place a new block on "home" after
  // whatever the highest orderIndex happens to be on "about".
  const rows = await db
    .select({ orderIndex: pageBlocks.orderIndex })
    .from(pageBlocks)
    .where(eq(pageBlocks.page, page));
  const nextOrderIndex = rows.reduce(
    (max, r) => Math.max(max, r.orderIndex + 1),
    0,
  );

  await db.insert(pageBlocks).values({
    page,
    type,
    config: BLOCK_REGISTRY[type].defaultConfig,
    orderIndex: nextOrderIndex,
    published: true,
  });
  cmsInvalidate(PATH);
}

export async function updateBlockConfig(
  id: string,
  config: Record<string, string>,
) {
  await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid id");
  await db
    .update(pageBlocks)
    .set({ config, updatedAt: new Date() })
    .where(eq(pageBlocks.id, id));
  cmsInvalidate(PATH);
}

export async function removeBlock(id: string) {
  await cmsRemove(cols, PATH, id);
}

export async function toggleBlockPublish(id: string, next: boolean) {
  await cmsTogglePublish(cols, PATH, id, next);
}

/**
 * Persists a drag-and-drop reorder in one shot: the client sends the full
 * list of block ids in their new order, and each one's orderIndex becomes its
 * position in that array. Unlike the CMS's up/down `move` (which swaps two
 * neighbours), a drag can relocate a block past several others in a single
 * gesture, so the whole list is rewritten rather than nudged one step.
 */
export async function reorderBlocks(orderedIds: string[]) {
  await requireAdmin();
  await Promise.all(
    orderedIds.map((id, i) =>
      db.update(pageBlocks).set({ orderIndex: i }).where(eq(pageBlocks.id, id)),
    ),
  );
  cmsInvalidate(PATH);
}
