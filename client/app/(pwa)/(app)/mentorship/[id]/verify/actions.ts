"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// Verify one of the three required in-person meetings. Either party can
// confirm; ordering, idempotency and the graduation milestone are enforced in
// the API.
export async function verifyMeeting(data: {
  mentorshipId: string;
  meetingNumber: number;
  method: string;
  lat?: string;
  lng?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch(`/mentorship/${data.mentorshipId}/verify-meeting`, {
    method: "POST",
    userId: me.id,
    body: {
      meetingNumber: data.meetingNumber,
      method: data.method,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    },
  });

  revalidatePath(`/mentorship/${data.mentorshipId}/verify`);
}
