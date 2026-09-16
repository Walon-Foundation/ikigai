"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// A mentor leaves feedback on a mentee's shared journal entry. The API confirms
// an active mentorship AND that the entry was actually shared — a private entry
// is refused there, where the check cannot be skipped.
export async function addJournalFeedback(data: {
  entryId: string;
  menteeId: string;
  comment: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/journal/feedback", {
    method: "POST",
    userId: me.id,
    body: data,
  });

  revalidatePath(`/mentor-portal/${data.menteeId}`);
}
