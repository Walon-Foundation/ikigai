"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { INTEREST_TAGS } from "@/lib/constants";

const MAX_NAME = 80;
const MAX_BIO = 500;
const MAX_TAGS = 8;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Edit the profile from settings. The button for this has been on the screen
// since the beginning with no onClick behind it.
export async function updateProfile(data: {
  displayName: string;
  bio: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const displayName = str(data.displayName, MAX_NAME);
  if (!displayName) throw new Error("Name can't be empty");

  await db
    .update(users)
    .set({ displayName, bio: str(data.bio, MAX_BIO) || null })
    .where(eq(users.clerkId, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

// Edit interests. These aren't decoration: users.interestTags is what the
// matcher reads, so changing them changes who this person is matched with.
export async function updateInterests(tags: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  if (!Array.isArray(tags)) throw new Error("Invalid interests");
  // Allowlist against the known tags — never persist arbitrary client strings
  // into a column the matcher trusts.
  const clean = [
    ...new Set(tags.filter((t) => INTEREST_TAGS.includes(t))),
  ].slice(0, MAX_TAGS);

  await db
    .update(users)
    .set({ interestTags: clean })
    .where(eq(users.clerkId, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/mentors");
}

// The default visibility of a new journal entry. `true` means the mentee is
// happy for their mentor to read entries by default.
export async function updateJournalDefault(mentorCanSee: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await db
    .update(users)
    .set({
      journalDefaultVisibility: mentorCanSee ? "mentor_only" : "private",
    })
    .where(eq(users.clerkId, userId));

  revalidatePath("/settings");
  revalidatePath("/journal");
}

// A browser PushSubscription serializes to an object with an https endpoint and
// a keys pair. Reject anything that doesn't look like one so we don't persist
// arbitrary client-supplied JSON.
function isPushSubscription(
  value: unknown,
): value is { endpoint: string; keys?: unknown } {
  if (typeof value !== "object" || value === null) return false;
  const endpoint = (value as { endpoint?: unknown }).endpoint;
  return typeof endpoint === "string" && endpoint.startsWith("https://");
}

export async function savePushSubscription(subscription: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // null clears the subscription (user turned push off / unsubscribed).
  if (subscription === null) {
    await db
      .update(users)
      .set({ pushSubscription: null })
      .where(eq(users.clerkId, userId));
    revalidatePath("/settings");
    return;
  }

  if (!isPushSubscription(subscription)) {
    throw new Error("Invalid push subscription");
  }
  // Bound the stored payload — a valid subscription is well under this.
  if (JSON.stringify(subscription).length > 4_000) {
    throw new Error("Push subscription too large");
  }
  await db
    .update(users)
    .set({ pushSubscription: subscription })
    .where(eq(users.clerkId, userId));
  revalidatePath("/settings");
}
