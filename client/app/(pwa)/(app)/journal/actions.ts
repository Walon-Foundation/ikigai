"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

export async function saveJournalEntry(data: {
  content: string;
  visibility: string;
  // Who the client believes is writing. Optional, because a live compose always
  // belongs to the session that is posting it — this exists for the offline
  // queue, where an entry can outlive the session that wrote it.
  expectedOwnerId?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  // The safeguarding keyword scan, the ownership check on a replayed offline
  // entry, and the admin alert all live in the API now, so the Expo journal
  // gets the same protections rather than a second implementation of them.
  const result = await apiFetch<{ success: boolean }>("/journal", {
    method: "POST",
    userId: me.id,
    body: data,
  });

  revalidatePath("/journal");
  return result;
}
