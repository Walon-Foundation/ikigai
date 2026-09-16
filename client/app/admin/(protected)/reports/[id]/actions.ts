"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { safetyReports } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";

const MAX_ADMIN_NOTES = 5_000;

// Resolve a safeguarding report, recording what the admin actually did.
//
// The notes were previously typed into a textarea, held in React state, and
// never sent — handleResolve posted only { reportId }. On a child-safeguarding
// platform the record of what action was taken is arguably the most important
// thing on the screen, and it was being discarded on navigation.
export async function resolveReport(data: {
  reportId: string;
  adminNotes: string;
}) {
  await requireAdmin();

  if (typeof data.reportId !== "string" || !data.reportId) {
    throw new Error("Invalid report");
  }

  const adminNotes =
    typeof data.adminNotes === "string"
      ? data.adminNotes.trim().slice(0, MAX_ADMIN_NOTES)
      : "";

  await db
    .update(safetyReports)
    .set({ resolvedAt: new Date(), adminNotes: adminNotes || null })
    .where(eq(safetyReports.id, data.reportId));

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${data.reportId}`);
  revalidatePath("/admin/safeguarding");
}
