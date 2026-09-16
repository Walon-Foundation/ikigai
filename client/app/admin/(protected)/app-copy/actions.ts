"use server";

import { db } from "@/db/db";
import { appCopy } from "@/db/schema";
import { text } from "@/lib/cms-admin";
import { cmsInvalidate } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/app-copy";

// The shape stored under each app-copy key — kept here rather than derived
// from the submitted form, same reasoning as app/admin/(protected)/cms/copy:
// a stray form field can never widen what a block contains.
function buildValue(
  key: string,
  v: Record<string, string>,
): Record<string, unknown> {
  switch (key) {
    case "pad_her_power_intro":
      return {
        title: text(v.title, 80) ?? "",
        body: text(v.body, 400) ?? "",
      };
    case "safety_crisis_banner":
      return {
        title: text(v.title, 80) ?? "",
        body: text(v.body, 200) ?? "",
      };
    case "dashboard_no_mentor":
      return {
        title: text(v.title, 60) ?? "",
        body: text(v.body, 200) ?? "",
        cta: text(v.cta, 40) ?? "",
      };
    default:
      // dashboard_active_modules_heading — a single label.
      return { label: text(v.label, 60) ?? "" };
  }
}

export async function saveAppCopy(key: string, v: Record<string, string>) {
  await requireAdmin();
  if (typeof key !== "string" || !key) throw new Error("Invalid copy block");

  const value = buildValue(key, v);
  await db
    .insert(appCopy)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appCopy.key,
      set: { value, updatedAt: new Date() },
    });

  cmsInvalidate(PATH);
}
