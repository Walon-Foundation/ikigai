"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { impactStats } from "@/db/schema";
import { requiredText } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/impact";
const cols = {
  table: impactStats,
  id: impactStats.id,
  orderIndex: impactStats.orderIndex,
  published: impactStats.published,
};

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const value = requiredText(v.value, 40, "Value");
  const label = requiredText(v.label, 80, "Label");
  const fields = { value, label, updatedAt: new Date() };

  if (id) {
    await db.update(impactStats).set(fields).where(eq(impactStats.id, id));
  } else {
    await db
      .insert(impactStats)
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
