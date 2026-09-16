"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { guardianLinks, users } from "@/db/schema";
import { dispatch } from "@/lib/notifications/dispatch";

async function resolveRequest(linkId: string, status: "accepted" | "declined") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [me] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new Error("User not found");

  // The child may only resolve a request addressed to them.
  const [link] = await db
    .update(guardianLinks)
    .set({ status, respondedAt: new Date() })
    .where(
      and(
        eq(guardianLinks.id, linkId),
        eq(guardianLinks.childId, me.id),
        eq(guardianLinks.status, "pending"),
      ),
    )
    .returning({ id: guardianLinks.id, parentId: guardianLinks.parentId });

  // The parent has been waiting on an answer with no way to see one arrive —
  // the parent portal shows nothing until the link is accepted, so a decline
  // looked identical to a request that had never been opened. This is also
  // the first thing to use the "guardian" notification type, which has been
  // declared and unused since it was written.
  if (link?.parentId) {
    const parentId = link.parentId;
    const childName = me.displayName;
    after(async () => {
      await dispatch({
        key:
          status === "accepted"
            ? "GUARDIAN_LINK_ACCEPTED"
            : "GUARDIAN_LINK_DECLINED",
        to: parentId,
        vars: { child: childName ?? "Your child" },
        dedupe: `${link.id}:${status}`,
      });
    });
  }

  revalidatePath("/dashboard");
}

export async function acceptGuardianLink(linkId: string) {
  await resolveRequest(linkId, "accepted");
}

export async function declineGuardianLink(linkId: string) {
  await resolveRequest(linkId, "declined");
}
