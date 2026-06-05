"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { guardianLinks, users } from "@/db/schema";

async function resolveRequest(linkId: string, status: "accepted" | "declined") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [me] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new Error("User not found");

  // The child may only resolve a request addressed to them.
  await db
    .update(guardianLinks)
    .set({ status, respondedAt: new Date() })
    .where(
      and(
        eq(guardianLinks.id, linkId),
        eq(guardianLinks.childId, me.id),
        eq(guardianLinks.status, "pending"),
      ),
    );

  revalidatePath("/dashboard");
}

export async function acceptGuardianLink(linkId: string) {
  await resolveRequest(linkId, "accepted");
}

export async function declineGuardianLink(linkId: string) {
  await resolveRequest(linkId, "declined");
}
