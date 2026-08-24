"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { programmes } from "@/db/schema";
import {
  bool,
  imageUrl,
  lines,
  requiredText,
  slugify,
  text,
} from "@/lib/cms-admin";

// Parse a datetime-local string (YYYY-MM-DDTHH:mm) to Date, or null if empty/invalid.
// Mirrors the helper in app/admin/(protected)/cms/events/actions.ts.
function parseDate(value: string): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
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
  const startsAt = parseDate(v.startsAt);
  const endsAt = parseDate(v.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) {
    throw new Error("End date must be after start date");
  }

  const fields = {
    name,
    pillarId: v.pillarId || null,
    summary: text(v.summary, 300),
    heroImageUrl: imageUrl(v.heroImageUrl, 500),
    about: text(v.about, 4_000),
    objectives: lines(v.objectives),
    activities: lines(v.activities),
    impactValue: text(v.impactValue, 40),
    impactLabel: text(v.impactLabel, 80),
    ctaLabel: text(v.ctaLabel, 60),
    ctaUrl: text(v.ctaUrl, 300),
    featured: bool(v.featured),
    startsAt,
    endsAt,
    // allowVolunteer defaults to true for backwards-compat; unchecked → false
    // The form sends "true" when checked, "" when unchecked. An existing row
    // with NULL (pre-migration) is treated as true in the UI (page.tsx) so
    // the admin sees it checked; here bool("") => false only when they
    // explicitly uncheck it.
    allowVolunteer: bool(v.allowVolunteer),
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
