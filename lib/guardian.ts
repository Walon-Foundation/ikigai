import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/db";
import { guardianLinks, users } from "@/db/schema";

export type PendingGuardianRequest = {
  id: string;
  parentName: string;
  relationship: string | null;
};

// Pending guardian requests addressed to this child. Claims any links that were
// created by email before the child had an account (childId still null).
export async function pendingRequestsForChild(child: {
  id: string;
  email: string | null;
}): Promise<PendingGuardianRequest[]> {
  if (child.email) {
    await db
      .update(guardianLinks)
      .set({ childId: child.id })
      .where(
        and(
          eq(guardianLinks.childEmail, child.email),
          isNull(guardianLinks.childId),
        ),
      );
  }

  const rows = await db
    .select({
      id: guardianLinks.id,
      relationship: guardianLinks.relationship,
      parentName: users.displayName,
    })
    .from(guardianLinks)
    .innerJoin(users, eq(guardianLinks.parentId, users.id))
    .where(
      and(
        eq(guardianLinks.childId, child.id),
        eq(guardianLinks.status, "pending"),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    parentName: r.parentName ?? "A guardian",
    relationship: r.relationship,
  }));
}

// The child a parent is linked to, if they have accepted. Returns null until
// the child consents — the gate that protects the child's data.
export async function acceptedChildForParent(parentId: string) {
  const [link] = await db
    .select({ childId: guardianLinks.childId })
    .from(guardianLinks)
    .where(
      and(
        eq(guardianLinks.parentId, parentId),
        eq(guardianLinks.status, "accepted"),
      ),
    )
    .limit(1);
  if (!link?.childId) return null;

  const [child] = await db
    .select()
    .from(users)
    .where(eq(users.id, link.childId))
    .limit(1);
  return child ?? null;
}

// The parent's current link status (any state) for the onboarding/portal UI.
export async function latestLinkForParent(parentId: string) {
  const [link] = await db
    .select()
    .from(guardianLinks)
    .where(
      and(
        eq(guardianLinks.parentId, parentId),
        or(
          eq(guardianLinks.status, "pending"),
          eq(guardianLinks.status, "accepted"),
        ),
      ),
    )
    .limit(1);
  return link ?? null;
}
