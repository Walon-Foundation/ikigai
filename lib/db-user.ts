import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export type DbUser = typeof users.$inferSelect;

// Per-request memoised lookup: the app layout, each page, and shared components
// all resolve the current user, and without this that identical query would run
// several times per navigation against Neon (a real latency cost). React
// cache() dedupes it to one round-trip per request.
const fetchUserByClerkId = cache(
  async (clerkId: string): Promise<DbUser | null> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    return user ?? null;
  },
);

export async function getOrCreateDbUser(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const existing = await fetchUserByClerkId(userId);
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
  return fetchUserByClerkId(userId);
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

// Authoritative admin gate for the /admin route group. Do NOT rely on proxy.ts
// alone: the proxy's role check only runs when the request host matches the
// admin subdomain, so any other route into these pages would otherwise render
// with no authorization. Next's own proxy docs say to verify authz inside the
// route, not just at the edge — so every admin layout/page calls this.
export async function requireAdmin(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await fetchUserByClerkId(userId);

  // Not an admin → show the terminal "not authorized" page on this domain.
  // Staying same-domain (vs a cross-domain redirect) avoids ping-ponging with
  // Clerk's session handshake, which can cause ERR_TOO_MANY_REDIRECTS.
  if (user?.role !== "admin") {
    redirect("/admin/unauthorized");
  }

  return user;
}
