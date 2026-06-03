"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export async function savePushSubscription(subscription: object) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db
    .update(users)
    .set({ pushSubscription: subscription })
    .where(eq(users.clerkId, userId));
  revalidatePath("/settings");
}
