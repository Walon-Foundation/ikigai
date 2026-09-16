"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { INTEREST_TAGS } from "@/lib/constants";
import {
  type NotificationCategory,
  type NotificationPrefs,
  SETTABLE_CATEGORIES,
} from "@/lib/notifications/categories";
import { isStorableSubscription } from "@/lib/notifications/subscription";

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

  // Same rules as /api/push/resubscribe, which writes this column too.
  if (!isStorableSubscription(subscription)) {
    throw new Error("Invalid push subscription");
  }
  await db
    .update(users)
    .set({ pushSubscription: subscription })
    .where(eq(users.clerkId, userId));
  revalidatePath("/settings");
}

// Per-category notification preferences.
//
// Written as a whole object rather than one flag at a time: the Settings screen
// holds the complete state anyway, and a partial write would need a read-modify
// -write over the neon-http driver for every tap of every checkbox.
//
// Categories marked alwaysOn are not in SETTABLE_CATEGORIES and are dropped
// here rather than trusted from the client — otherwise a hand-crafted request
// could switch off safeguarding and account notifications, which is exactly the
// thing this product does not offer.
export async function updateNotificationPrefs(input: {
  push?: boolean;
  email?: boolean;
  categories?: Record<string, boolean>;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const settable = new Set<string>(SETTABLE_CATEGORIES.map((c) => c.id));
  const categories: Partial<Record<NotificationCategory, boolean>> = {};
  for (const [key, on] of Object.entries(input.categories ?? {})) {
    if (settable.has(key) && typeof on === "boolean") {
      categories[key as NotificationCategory] = on;
    }
  }

  const prefs: NotificationPrefs = {
    push: input.push !== false,
    email: input.email !== false,
    categories,
  };

  await db
    .update(users)
    .set({ notificationPrefs: prefs })
    .where(eq(users.clerkId, userId));
  revalidatePath("/settings");
}
