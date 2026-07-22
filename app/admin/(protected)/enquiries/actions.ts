"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { enquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";

const STATUSES = ["new", "in_progress", "handled"] as const;

export async function setEnquiryStatus(id: string, status: string) {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid enquiry");
  const next = (STATUSES as readonly string[]).includes(status)
    ? status
    : "new";

  await db
    .update(enquiries)
    .set({
      status: next,
      // Stamp who cleared it and when, so a handled enquiry is accountable.
      handledBy: next === "handled" ? admin.id : null,
      handledAt: next === "handled" ? new Date() : null,
    })
    .where(eq(enquiries.id, id));

  revalidatePath("/admin/enquiries");
}
