"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// The Purpose Book's "Life Vision" module is the one free-text field the mentee
// authors after onboarding; everything else is derived from the assessment.
export async function saveLifeVision(vision: unknown) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/purpose-book/life-vision", {
    method: "PUT",
    userId: me.id,
    body: { vision },
  });

  revalidatePath("/purpose-book");
}
