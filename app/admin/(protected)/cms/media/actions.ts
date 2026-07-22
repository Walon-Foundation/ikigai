"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { mediaAssets } from "@/db/schema";
import { text } from "@/lib/cms-admin";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/cms/media";

// Record an image that was just uploaded to the library. The bytes are already
// in UploadThing (uploaded browser-direct); this only stores the URL so it can
// be found and pasted later.
export async function addMedia(url: string, label: string) {
  await requireAdmin();
  const clean = text(url, 500);
  if (!clean) throw new Error("No image to save");
  await db.insert(mediaAssets).values({ url: clean, label: text(label, 120) });
  revalidatePath(PATH);
}

export async function removeMedia(id: string) {
  await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid image");
  // Only the library reference is removed. The file itself is left in storage:
  // it may still be in use by a programme or story that pasted its URL, and
  // deleting the bytes would break those pages. Storage cleanup, if ever
  // needed, is a separate deliberate job — not a side effect of tidying a list.
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  revalidatePath(PATH);
}
