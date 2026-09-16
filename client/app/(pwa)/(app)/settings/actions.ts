"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// Thin callers of the API's AccountModule. Validation, the INTEREST_TAGS
// allowlist and the always-on notification categories all live there now, so
// the Expo settings screen enforces the same rules.

export async function updateProfile(data: {
  displayName: string;
  bio: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/account/profile", {
    method: "PATCH",
    userId: me.id,
    body: { displayName: data.displayName, bio: data.bio },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

// Interests aren't decoration: users.interestTags is what the matcher reads, so
// changing them changes who this person is matched with.
export async function updateInterests(tags: string[]) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/account/interests", {
    method: "PUT",
    userId: me.id,
    body: { tags },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/mentors");
}

// `true` means the mentee is happy for their mentor to read new entries.
export async function updateJournalDefault(mentorCanSee: boolean) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/account/journal-default", {
    method: "PATCH",
    userId: me.id,
    body: { mentorCanSee },
  });

  revalidatePath("/settings");
  revalidatePath("/journal");
}

export async function savePushSubscription(subscription: unknown) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  // null clears it — the user turned push off or unsubscribed.
  await apiFetch("/account/push-subscription", {
    method: "PUT",
    userId: me.id,
    body: { subscription },
  });

  revalidatePath("/settings");
}

export async function updateNotificationPrefs(input: {
  push?: boolean;
  email?: boolean;
  categories?: Record<string, boolean>;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  await apiFetch("/account/notification-prefs", {
    method: "PUT",
    userId: me.id,
    body: input,
  });

  revalidatePath("/settings");
}
