"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { users } from "@/db/schema";

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
