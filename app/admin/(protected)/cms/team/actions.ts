"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { teamMembers } from "@/db/schema";
import { requiredText, text } from "@/lib/cms-admin";
import {
  cmsInvalidate,
  cmsMove,
  cmsRemove,
  cmsTogglePublish,
  nextOrderIndex,
} from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/team";
const cols = {
  table: teamMembers,
  id: teamMembers.id,
  orderIndex: teamMembers.orderIndex,
  published: teamMembers.published,
};

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const name = requiredText(v.name, 120, "Name");
  const fields = {
    name,
    role: text(v.role, 120),
    bio: text(v.bio, 800),
    photoUrl: text(v.photoUrl, 500),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(teamMembers).set(fields).where(eq(teamMembers.id, id));
  } else {
    await db
      .insert(teamMembers)
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
