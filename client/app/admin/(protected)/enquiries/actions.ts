"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { enquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { pwaInstallUrl, sendMail } from "@/lib/email";
import { escapeHtml, sendableAddress } from "@/lib/email/templates";

// The outcomes an enquiry can be moved to.
//
// `handled` is the ACCEPTED outcome — it emails the enquirer to congratulate
// them. That is not what "handled" means in ordinary English, and an operator
// who used it to mean "I dealt with this; I turned them down" was sending
// congratulations to someone they had just declined, from a dropdown with no
// label and no confirmation. Two things follow from that, and both live outside
// this list: the option is labelled by its consequence, and it asks first (see
// status-control.tsx).
//
// `closed` is the terminal outcome that emails nobody, so an operator finishing
// with an enquiry no longer has to pick a status that sends mail. `handled` is
// kept rather than renamed because existing rows carry it — renaming it would
// silently reclassify decisions that were already taken.
const STATUSES = ["new", "in_progress", "handled", "closed"] as const;

// Which statuses mean the enquiry is decided and off the desk. Both stamp
// handled_by/handled_at so a finished enquiry is accountable to a person;
// only `handled` mails the enquirer.
const DECIDED: readonly string[] = ["handled", "closed"];
const EMAILS_THE_ENQUIRER = "handled";

// Escape text that is about to be interpolated into an HTML email body.
//
// `name` here comes from the UNAUTHENTICATED public enquiry form on the
// marketing site, so its contents are chosen by a stranger. Interpolated raw it
// let that stranger put arbitrary markup — a link, a tracking pixel, a forged
// "confirm your account" block — inside a message sent from Ikigai's own
// DKIM-signed domain, which is exactly the envelope that makes such a message
// believable. Escaped at the point of interpolation, it can only ever be text.
//

export async function setEnquiryStatus(id: string, status: string) {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) throw new Error("Invalid enquiry");
  const next = (STATUSES as readonly string[]).includes(status)
    ? status
    : "new";

  const [row] = await db
    .select()
    .from(enquiries)
    .where(eq(enquiries.id, id))
    .limit(1);

  const decided = DECIDED.includes(next);

  await db
    .update(enquiries)
    .set({
      status: next,
      // Stamp who decided it and when, so a finished enquiry is accountable.
      handledBy: decided ? admin.id : null,
      handledAt: decided ? new Date() : null,
    })
    .where(eq(enquiries.id, id));

  // Email only on acceptance, and only on the transition into it — re-picking
  // the same status must not send a second round of congratulations.
  const recipient = sendableAddress(row?.email);
  if (
    next === EMAILS_THE_ENQUIRER &&
    row &&
    row.status !== EMAILS_THE_ENQUIRER &&
    recipient
  ) {
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
      const name = escapeHtml(row.name ?? "there");
      await sendMail({
        to: recipient,
        subject: `Your Ikigai ${typeLabel} — accepted! 🎉`,
        html: `<p>Hi ${name},</p><p>Your ${typeLabel} has been <strong>accepted</strong> by the Ikigai team.</p>${row.type === "mentor" ? `<p>Install the app: <a href="${appUrl}">${appUrl}</a> — open on your phone and tap Add to Home Screen.</p>` : `<p>Our team will be in touch with next steps. You can also open the app at <a href="${appUrl}">${appUrl}</a>.</p>`}<p style="color:#5C5A55;font-size:14px">Please check your email inbox (and spam folder) for details.</p><p>— Ikigai</p>`,
        text: `Hi ${row.name ?? "there"},\nYour ${typeLabel} has been accepted! ${row.type === "mentor" ? `Install app: ${appUrl}` : `App: ${appUrl}`}\nPlease check your inbox.\n— Ikigai`,
      }).catch((e) => console.error("enquiry handled email failed", e));
    });
  }

  revalidatePath("/admin/enquiries");
}
