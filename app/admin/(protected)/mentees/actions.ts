"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { dispatch } from "@/lib/notifications/dispatch";

const MAX_REASON_LENGTH = 2000;

/**
 * Approve or reject a mentee application.
 *
 * Deliberately the same shape, and the same three columns, as verifyMentor:
 * `verifiedAt` / `rejectedAt` / `rejectionReason` are not mentor-specific, and
 * a second parallel set of columns for mentees would mean two definitions of
 * "pending" drifting apart. Pending is undecided — verified_at IS NULL AND
 * rejected_at IS NULL — for both roles.
 *
 * What is NOT the same: no email goes out. A rejected mentee is a young person,
 * often a minor, and an automated "your application was unsuccessful" message
 * is the wrong way for that to reach them — the in-app notification says the
 * team will be in touch, and the team follows up in person. Same reason the
 * rejection reason stays an internal note.
 */
export async function verifyMentee(data: {
  menteeId: string;
  action: "approved" | "rejected";
  reason?: string;
}) {
  await requireAdmin();

  if (typeof data.menteeId !== "string" || !data.menteeId) {
    throw new Error("Invalid mentee");
  }
  if (data.action !== "approved" && data.action !== "rejected") {
    throw new Error("Invalid action");
  }

  // Confirm the target is actually a mentee before writing a decision to it.
  // These columns also drive the mentor queue, so an unchecked id here would
  // let this action approve or reject a mentor application from the wrong
  // screen entirely.
  const [target] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, data.menteeId))
    .limit(1);
  if (!target) throw new Error("Mentee not found");
  if (target.role !== "mentee" && target.role !== "club_lead") {
    throw new Error("Not a mentee application");
  }

  const approved = data.action === "approved";
  const reason =
    typeof data.reason === "string"
      ? data.reason.trim().slice(0, MAX_REASON_LENGTH)
      : "";
  if (!approved && !reason) {
    throw new Error("A rejection reason is required");
  }

  await db
    .update(users)
    .set(
      approved
        ? { verifiedAt: new Date(), rejectedAt: null, rejectionReason: null }
        : { verifiedAt: null, rejectedAt: new Date(), rejectionReason: reason },
    )
    .where(eq(users.id, data.menteeId));

  after(async () => {
    await dispatch({
      key: approved ? "MENTEE_APPROVED" : "MENTEE_REJECTED",
      to: data.menteeId,
    });
  });

  revalidatePath("/admin/mentees");
}
