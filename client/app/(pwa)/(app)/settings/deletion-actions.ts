"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

/**
 * Ask for the account to be deleted.
 *
 * This marks the account rather than erasing it. The purge runs after a grace
 * period and cancelling restores it. Many of the mentees here are minors; an
 * impulsive deletion at a bad moment should be recoverable, and an irreversible
 * button that fires on one tap is the wrong shape for this platform.
 */
export async function requestAccountDeletion() {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  const result = await apiFetch<{ graceDays: number }>("/account/deletion", {
    method: "POST",
    userId: me.id,
  });

  revalidatePath("/settings");
  return result;
}

export async function cancelAccountDeletion() {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/account/deletion", { method: "DELETE", userId: me.id });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
