"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { partners } from "@/db/schema";
import { requiredText, text } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/partners";
const cols = {
  table: partners,
  id: partners.id,
  orderIndex: partners.orderIndex,
  published: partners.published,
};

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const name = requiredText(v.name, 160, "Name");
  const fields = {
    name,
    logoUrl: text(v.logoUrl, 500),
    websiteUrl: text(v.websiteUrl, 300),
    description: text(v.description, 600),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(partners).set(fields).where(eq(partners.id, id));
  } else {
    await db
      .insert(partners)
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
