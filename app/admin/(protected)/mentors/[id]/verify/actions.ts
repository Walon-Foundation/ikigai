"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { pwaInstallUrl, sendMail } from "@/lib/email";
import { notifyUser } from "@/lib/notify";

/** Long enough for a real handover note, short enough not to be a document. */
const MAX_REASON_LENGTH = 2000;

// Escape text before it is interpolated into an HTML email body.
//
// `displayName` is whatever the applicant typed into their own profile, so it
// is user-controlled: unescaped, a mentor applicant could put arbitrary markup
// into a message Ikigai sends from its own DKIM-signed domain. Escaped at the
// point of interpolation, a name can only ever render as a name.
//
// Module-local rather than shared: a "use server" module may only export async
// functions, so a helper defined here cannot be exported. Its twin lives in the
// enquiries action for the same reason.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Nodemailer's `to` accepts a comma-separated address LIST, so a stored value
// like "attacker@evil.com, victim@school.edu" fans one message out to
// recipients Ikigai never intended, over Ikigai's own signed domain. Only a
// single, plainly well-formed address is sendable.
function sendableAddress(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const address = value.trim();
  if (address.length > 254) return null;
  return /^[^\s@,;:<>"()[\]\\]+@[^\s@,;:<>"()[\]\\]+\.[a-z]{2,}$/i.test(address)
    ? address
    : null;
}

// Approve or reject a mentor application.
//
// This was a route handler that hand-rolled its own auth check and returned
// JSON the client ignored. As a server action it reuses requireAdmin() like the
// rest of the admin surface, and revalidates instead of leaving the client to
// fake the outcome with local state.
//
// Rejection records a decision; it does not rewrite who the person is. It used
// to set `role` back to "mentee", which erased the application itself: both
// queries on the mentors queue filter role = 'mentor', so a rejected applicant
// vanished from Pending and Verified at once, this very page 404'd for them,
// and nothing in the admin panel can put a role back — so a misclick could not
// be undone from inside the product. `rejectedAt` + `rejectionReason` keep the
// applicant visible, the decision reversible, and the reason recoverable by
// whoever follows up. See db/schema.ts and schools.rejectedAt for the pattern.
export async function verifyMentor(data: {
  mentorId: string;
  action: "approved" | "rejected";
  reason?: string;
}) {
  await requireAdmin();

  if (typeof data.mentorId !== "string" || !data.mentorId) {
    throw new Error("Invalid mentor");
  }
  if (data.action !== "approved" && data.action !== "rejected") {
    throw new Error("Invalid action");
  }

  const approved = data.action === "approved";

  // Enforced here, not only in the UI: a rejection with no reason leaves the
  // applicant told "we need more information" and the team unable to say what.
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
        ? // Approving clears any earlier rejection — otherwise an overturned
          // decision would show as both verified and rejected.
          { verifiedAt: new Date(), rejectedAt: null, rejectionReason: null }
        : { verifiedAt: null, rejectedAt: new Date(), rejectionReason: reason },
    )
    .where(eq(users.id, data.mentorId));

  // Deferred: the admin should not wait on mail/push to see their own decision land.
  after(async () => {
    const [mentor] = await db
      .select({ email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, data.mentorId))
      .limit(1);

    const appUrl = pwaInstallUrl();
    const recipient = sendableAddress(mentor?.email);
    const plainName = mentor?.displayName ?? "there";
    const safeName = escapeHtml(plainName);

    if (approved && recipient) {
      await sendMail({
        to: recipient,
        subject: "You're approved as an Ikigai mentor 🎉",
        html: `
          <p>Hi ${safeName},</p>
          <p>Great news — your Ikigai mentor application has been <strong>approved</strong>!</p>
          <p>You can now receive mentee requests and start mentoring.</p>
          <p><a href="${appUrl}" style="display:inline-block;background:#1A5C3A;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">Open Ikigai</a></p>
          <p style="color:#5C5A55;font-size:14px">Install the PWA for the best experience: open <a href="${appUrl}">${appUrl}</a> on your phone and tap <em>Add to Home Screen</em>. Check your email inbox (and spam) for future mentee updates.</p>
          <p>— The Ikigai team</p>
        `,
        text: `Hi ${plainName},\n\nYour mentor application has been approved! Open Ikigai: ${appUrl}\nInstall the PWA: open ${appUrl} on your phone and Add to Home Screen.\nPlease check your email inbox for future updates.\n\n— Ikigai`,
      }).catch((e) => console.error("mentor approve email failed", e));
    } else if (!approved && recipient) {
      // The reason itself is an internal handover note and is deliberately not
      // quoted here: it is written for the colleague who picks this up, in
      // whatever terms are useful to them, and a vetting note about an adult
      // who applied to work with children is not copy to forward unreviewed.
      // What the applicant gets is a promise that a person will follow up —
      // and now that promise is backed by a recorded reason.
      await sendMail({
        to: recipient,
        subject: "Ikigai mentor application update",
        html: `<p>Hi ${safeName},</p><p>We can't take your mentor application forward as it stands. Someone from the Ikigai team will follow up by email with the details and what can happen next — please check your inbox (and spam folder).</p><p>— Ikigai</p>`,
        text: `Hi ${plainName},\nWe can't take your mentor application forward as it stands. Someone from the Ikigai team will follow up by email with the details and what can happen next — please check your inbox (and spam folder).\n— Ikigai`,
      }).catch((e) => console.error("mentor reject email failed", e));
    }

    await notifyUser(
      approved
        ? {
            userId: data.mentorId,
            title: "You're an approved mentor! ✅",
            body: "Ikigai approved your mentor profile. Check your email for the PWA link.",
            type: "milestone",
            url: "/mentor-portal",
          }
        : {
            userId: data.mentorId,
            title: "Mentor application update",
            body: "We can't take your mentor application forward as it stands. The team will follow up by email.",
            type: "milestone",
            url: "/dashboard",
          },
    );
  });

  revalidatePath("/admin/mentors");
  revalidatePath(`/admin/mentors/${data.mentorId}/verify`);
}
