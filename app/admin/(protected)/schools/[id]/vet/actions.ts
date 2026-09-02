"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { schools } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { dispatch } from "@/lib/notifications/dispatch";

// Approve or reject a school clubhouse registration.
//
// The route handler this replaces had an `if (action === "approved")` and no
// else branch, so rejecting wrote nothing at all and returned success — while
// the UI announced "rejected — the club lead has been notified". Both halves
// were false: nothing was recorded, nobody was told, and the school stayed in
// the pending queue for the next admin to review again. Approve was quietly
// broken too: the vetting page promises "the club lead will receive a
// notification and can start inviting members immediately", and no
// notification was ever sent.
export async function vetSchool(data: {
  schoolId: string;
  action: "approved" | "rejected";
}) {
  await requireAdmin();

  if (typeof data.schoolId !== "string" || !data.schoolId) {
    throw new Error("Invalid school");
  }
  if (data.action !== "approved" && data.action !== "rejected") {
    throw new Error("Invalid action");
  }

  const approved = data.action === "approved";

  // Returning the row gives us the club lead to notify without a second
  // round-trip, and tells us whether the school existed at all.
  const [school] = await db
    .update(schools)
    .set(
      approved
        ? { verifiedAt: new Date(), rejectedAt: null }
        : { rejectedAt: new Date(), verifiedAt: null },
    )
    .where(eq(schools.id, data.schoolId))
    .returning({ id: schools.id, clubLeadId: schools.clubLeadId });

  if (!school) throw new Error("School not found");

  if (school.clubLeadId) {
    const clubLeadId = school.clubLeadId;
    after(async () => {
      await dispatch({
        key: approved ? "SCHOOL_APPROVED" : "SCHOOL_REJECTED",
        to: clubLeadId,
      });
    });
  }

  revalidatePath("/admin/schools");
  revalidatePath(`/admin/schools/${data.schoolId}/vet`);
}
