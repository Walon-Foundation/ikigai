"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { notifyUser } from "@/lib/notify";

// Approve or reject a mentor application.
//
// This was a route handler that hand-rolled its own auth check and returned
// JSON the client ignored. As a server action it reuses requireAdmin() like the
// rest of the admin surface, and revalidates instead of leaving the client to
// fake the outcome with local state.
export async function verifyMentor(data: {
  mentorId: string;
  action: "approved" | "rejected";
}) {
  await requireAdmin();

  if (typeof data.mentorId !== "string" || !data.mentorId) {
    throw new Error("Invalid mentor");
  }
  if (data.action !== "approved" && data.action !== "rejected") {
    throw new Error("Invalid action");
  }

  const approved = data.action === "approved";

  await db
    .update(users)
    .set(
      approved
        ? { verifiedAt: new Date() }
        : { role: "mentee", verifiedAt: null },
    )
    .where(eq(users.id, data.mentorId));

  // Deferred: the admin should not wait on FCM to see their own decision land.
  after(async () => {
    await notifyUser(
      approved
        ? {
            userId: data.mentorId,
            title: "You're an approved mentor! ✅",
            body: "ikigai approved your mentor profile. You can now receive mentee requests.",
            type: "milestone",
            url: "/mentor-portal",
          }
        : {
            userId: data.mentorId,
            title: "Mentor application update",
            body: "Your mentor application needs more information. Please check your email from the ikigai team.",
            type: "milestone",
            url: "/dashboard",
          },
    );
  });

  revalidatePath("/admin/mentors");
  revalidatePath(`/admin/mentors/${data.mentorId}/verify`);
}
