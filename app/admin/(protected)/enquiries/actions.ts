"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { enquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { pwaInstallUrl, sendMail } from "@/lib/email";

const STATUSES = ["new", "in_progress", "handled"] as const;

export async function setEnquiryStatus(id: string, status: string) {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid enquiry");
  const next = (STATUSES as readonly string[]).includes(status)
    ? status
    : "new";

  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);

  await db
    .update(enquiries)
    .set({
      status: next,
      // Stamp who cleared it and when, so a handled enquiry is accountable.
      handledBy: next === "handled" ? admin.id : null,
      handledAt: next === "handled" ? new Date() : null,
    })
    .where(eq(enquiries.id, id));

  // Email on acceptance — handled means the Ikigai team has accepted/processed
  // the volunteer/partner/programme/mentor request. Tell them to check inbox.
  if (next === "handled" && row && row.status !== "handled" && row.email) {
    after(async () => {
      const appUrl = pwaInstallUrl();
      const typeLabel =
        row.type === "volunteer"
          ? "volunteer application"
          : row.type === "partner"
            ? "partnership interest"
            : row.type === "programme"
              ? "programme request"
              : row.type === "mentor"
                ? "mentor application"
                : "enquiry";
      await sendMail({
        to: row.email,
        subject: `Your Ikigai ${typeLabel} — accepted! 🎉`,
        html: `<p>Hi ${row.name ?? "there"},</p><p>Your ${typeLabel} has been <strong>accepted</strong> by the Ikigai team.</p>${row.type === "mentor" ? `<p>Install the app: <a href="${appUrl}">${appUrl}</a> — open on your phone and tap Add to Home Screen.</p>` : `<p>Our team will be in touch with next steps. You can also open the app at <a href="${appUrl}">${appUrl}</a>.</p>`}<p style="color:#5C5A55;font-size:14px">Please check your email inbox (and spam folder) for details.</p><p>— Ikigai</p>`,
        text: `Hi ${row.name ?? "there"},\nYour ${typeLabel} has been accepted! ${row.type === "mentor" ? `Install app: ${appUrl}` : `App: ${appUrl}`}\nPlease check your inbox.\n— Ikigai`,
      }).catch((e) => console.error("enquiry handled email failed", e));
    });
  }

  revalidatePath("/admin/enquiries");
}
