"use server";

import { db } from "@/db/db";
import { siteCopy } from "@/db/schema";
import { lines, text } from "@/lib/cms-admin";
import { cmsInvalidate } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/copy";

// The shape stored under each copy key. Kept here (not derived from the form)
// so a stray form field can never widen what a copy block contains.
function buildValue(
  key: string,
  v: Record<string, string>,
): Record<string, unknown> {
  switch (key) {
    case "hero":
      return {
        headline: text(v.headline, 200) ?? "",
        body: text(v.body, 600) ?? "",
        primaryLabel: text(v.primaryLabel, 40) ?? "",
        primaryHref: text(v.primaryHref, 200) ?? "",
        secondaryLabel: text(v.secondaryLabel, 40) ?? "",
        secondaryHref: text(v.secondaryHref, 200) ?? "",
      };
    case "values":
      return { items: lines(v.items, 12, 60) };
    default:
      // about_intro, mission, vision — a single body paragraph.
      return { body: text(v.body, 1_500) ?? "" };
  }
}

export async function saveCopy(key: string, v: Record<string, string>) {
  await requireAdmin();
  if (typeof key !== "string" || !key) throw new Error("Invalid copy block");

  const value = buildValue(key, v);
  await db
    .insert(siteCopy)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteCopy.key,
      set: { value, updatedAt: new Date() },
    });

  cmsInvalidate(PATH);
}
