"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/db-user";
import { pwaInstallUrl, sendMail } from "@/lib/email";
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

  // Deferred: the admin should not wait on mail/push to see their own decision land.
  after(async () => {
    const [mentor] = await db
      .select({ email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, data.mentorId))
      .limit(1);

    const appUrl = pwaInstallUrl();

    if (approved && mentor?.email) {
      await sendMail({
        to: mentor.email,
        subject: "You're approved as an Ikigai mentor 🎉",
        html: `
          <p>Hi ${mentor.displayName ?? "there"},</p>
          <p>Great news — your Ikigai mentor application has been <strong>approved</strong>!</p>
          <p>You can now receive mentee requests and start mentoring.</p>
          <p><a href="${appUrl}" style="display:inline-block;background:#1A5C3A;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">Open Ikigai</a></p>
          <p style="color:#5C5A55;font-size:14px">Install the PWA for the best experience: open <a href="${appUrl}">${appUrl}</a> on your phone and tap <em>Add to Home Screen</em>. Check your email inbox (and spam) for future mentee updates.</p>
          <p>— The Ikigai team</p>
        `,
        text: `Hi ${mentor.displayName ?? "there"},\n\nYour mentor application has been approved! Open Ikigai: ${appUrl}\nInstall the PWA: open ${appUrl} on your phone and Add to Home Screen.\nPlease check your email inbox for future updates.\n\n— Ikigai`,
      }).catch((e) => console.error("mentor approve email failed", e));
    } else if (!approved && mentor?.email) {
      await sendMail({
        to: mentor.email,
        subject: "Ikigai mentor application update",
        html: `<p>Hi ${mentor.displayName ?? "there"},</p><p>Your mentor application needs more information. Our team will follow up by email. Please check your inbox (and spam folder).</p><p>— Ikigai</p>`,
        text: `Hi ${mentor.displayName ?? "there"},\nYour mentor application needs more info. Please check your email inbox.\n— Ikigai`,
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
            body: "Your mentor application needs more information. Please check your email.",
            type: "milestone",
            url: "/dashboard",
          },
    );
  });

  revalidatePath("/admin/mentors");
  revalidatePath(`/admin/mentors/${data.mentorId}/verify`);
}
