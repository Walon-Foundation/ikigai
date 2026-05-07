import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type DbUser = typeof users.$inferSelect;

export async function getOrCreateDbUser(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (existing) return existing;

  const clerkUser = await currentUser();
  const displayName =
    clerkUser?.fullName ??
    ([clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "User");

  const [created] = await db
    .insert(users)
    .values({ clerkId: userId, role: "mentee", displayName, growthLevel: 1, interestTags: [] })
    .returning();
  return created;
}

export async function getDbUser(): Promise<DbUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  return user ?? null;
}
