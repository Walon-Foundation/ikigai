import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
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

function isPlaceholderName(value: string | null | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "User";
}

function deriveDisplayName(
  clerkUser: { firstName: string | null; lastName: string | null; fullName: string | null } | null | undefined,
): string {
  const parts = [clerkUser?.firstName, clerkUser?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return clerkUser?.fullName?.trim() || parts || "User";
}

export async function getOrCreateDbUser(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const existing = await fetchUserByClerkId(userId);
  if (existing) {
    // A stale placeholder ("User", "", null) is a past bug — if Clerk now has
    // a real name, heal it here. This is the fast path that fixes every
    // existing user who was created via the ?? bug or via an email-only sign
    // up that never ran the onboarding displayName write.
    if (isPlaceholderName(existing.displayName)) {
      const clerkUser = await currentUser();
      const fresh = deriveDisplayName(clerkUser);
      if (fresh !== "User" && fresh !== existing.displayName) {
        const [updated] = await db
          .update(users)
          .set({ displayName: fresh })
          .where(eq(users.clerkId, userId))
          .returning();
        if (updated) return updated;
      }
    }
    return existing;
  }

  const clerkUser = await currentUser();
  const displayName = deriveDisplayName(clerkUser);
  // ONLY the primary address, and only once Clerk says it is verified. The
  // re-link below hands an existing row to whoever presents this address, so
  // the address has to be one Clerk has proven this person controls. Taking
  // emailAddresses[0] as a fallback did not: a secondary address needs no
  // confirmation to sit in that array, so anyone could have typed a victim's
  // address into their own Clerk profile and been handed the victim's row.
  const primaryEmail = clerkUser?.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );
  const email = primaryEmail?.emailAddress ?? null;
  const emailIsVerified = primaryEmail?.verification?.status === "verified";

  // Clerk can issue a new clerkId for someone who already has a row here (a
  // dev→prod key swap orphans every existing id; signing up again does the
  // same). Re-link that row by email instead of inserting a second account —
  // otherwise the same person silently ends up with two disconnected users
  // rows, neither of which has the other's history.
  //
  // That convenience is also an account-takeover primitive, because users.email
  // carries no unique constraint and this rewrites whichever row it finds. Three
  // guards keep it to the case it was written for:
  //
  //  - verified primary address only (above), so the claim is proven;
  //  - never an admin row, so the worst case of a missed guard is inheriting a
  //    peer account rather than the safeguarding queue and every user record;
  //  - never a soft-deleted row, because a purged account is a tombstone that
  //    safety_reports still point at (see lib/purge.ts) — re-linking it would
  //    resurrect a deliberately closed account, and the scrubbed row has no
  //    history left to reunite the person with anyway.
  //
  // If no row survives these filters we fall through and insert a fresh one,
  // which is the safe direction to fail: a duplicate account is recoverable by
  // an admin, a hijacked one is not.
  if (email && emailIsVerified) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          ne(users.role, "admin"),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(desc(users.createdAt))
      .limit(1);
    if (byEmail) {
      // If the existing row has a placeholder name, replace it with the Clerk
      // name — re-link is the moment we learn the real name for an orphaned
      // row (dev→prod swap, res-signup). Don't overwrite a real custom name
      // the user set in Settings.
      const shouldHealName =
        isPlaceholderName(byEmail.displayName) && displayName !== "User";
      const [relinked] = await db
        .update(users)
        .set({
          clerkId: userId,
          ...(shouldHealName ? { displayName } : {}),
        })
        .where(eq(users.id, byEmail.id))
        .returning();
      return relinked;
    }
  }

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

/**
 * The signed-in user, confirmed to be a mentor ikigai has APPROVED.
 *
 * `role` is what someone signed up as. `verifiedAt` is what the admin team
 * decided after reading their government ID and CV, and it is the second one
 * that may put an adult in front of a child — so every action a mentor takes
 * over a mentee's programme goes through here.
 *
 * The browse, match and request paths already filter on verifiedAt, so an
 * unapproved mentor is invisible to mentees. The gap this closes is approval
 * being taken AWAY: a mentor approved last month and rejected today kept every
 * mentee they already had, and full control of the programme those children
 * were following. Rejection is exactly when that access has to stop.
 *
 * Throws rather than redirecting, because every caller is a server action —
 * a public endpoint reachable by anyone signed in, whatever page rendered it.
 * The screens explain the refusal; this is what enforces it.
 */
export async function requireApprovedMentor(): Promise<DbUser> {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthenticated");
  if (user.role !== "mentor") throw new Error("Forbidden");
  if (!user.verifiedAt) throw new Error("Not approved");
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
