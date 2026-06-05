import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { users } from "@/db/schema";

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
  const parts = [clerkUser?.firstName, clerkUser?.lastName]
    .filter(Boolean)
    .join(" ");
  const displayName = clerkUser?.fullName ?? parts ?? "User";
  const email =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null;

  // Use ON CONFLICT DO NOTHING to handle concurrent inserts safely
  await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      role: "mentee",
      displayName,
      growthLevel: 1,
      interestTags: [],
    })
    .onConflictDoNothing({ target: users.clerkId });

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  return row;
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

// Role-scoped surfaces. A signed-in user whose role isn't in `allowed` is
// redirected to their dashboard — which renders the right view for them.
// `mentee` covers legacy `club_lead` and pre-onboarding null roles, matching
// how AppLayout groups them.
export async function requireRole(
  allowed: ("mentee" | "mentor" | "parent")[],
): Promise<DbUser> {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const effectiveRole =
    user.role === "mentor" || user.role === "parent" ? user.role : "mentee";
  if (!allowed.includes(effectiveRole)) redirect("/dashboard");

  return user;
}
