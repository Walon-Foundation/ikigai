"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db/db";
import { milestones, safetyReports, users } from "@/db/schema";
import { dispatchToAdmins } from "@/lib/notifications/dispatch";

const REPORT_TYPES = ["inappropriate", "concern"] as const;
const MAX_REPORT_NOTES = 5_000;

export async function submitSafetyReport(data: {
  type: string;
  notes: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Client args are unverified — validate before persisting.
  const type = (REPORT_TYPES as readonly string[]).includes(data.type)
    ? data.type
    : "concern";
  const notes =
    typeof data.notes === "string"
      ? data.notes.trim().slice(0, MAX_REPORT_NOTES)
      : "";

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");

  // reporterId is stored on purpose and must stay: a safeguarding team that
  // cannot identify the child who reported abuse cannot check on them, cannot
  // ask the one follow-up question that makes the report actionable, and
  // cannot tell a repeated report from a first one. Dropping it would look
  // like a privacy win and would in fact remove the whole follow-up path.
  //
  // What it does NOT license is telling the reporter otherwise. The form's
  // copy (report-form.tsx) now states plainly that the safeguarding team sees
  // who sent the report and that the reported person never does — anyone
  // changing either side must change the other, or the app is back to making
  // a promise to a child that it breaks. Reporter identity is exposed only
  // inside /admin (requireAdmin), never on any PWA surface.
  //
  // Any role may file a report: a mentor or parent raising a concern about a
  // young person is exactly as valid as a mentee raising one, so there is no
  // role check here beyond being signed in.
  const [report] = await db
    .insert(safetyReports)
    .values({
      reporterId: user.id,
      type,
      notes,
    })
    .returning({ id: safetyReports.id });

  // Tell the safeguarding team now, rather than whenever somebody next happens
  // to open the queue. A report from a child about their own safety sitting
  // unread because nobody knew it existed is the one outcome this feature
  // cannot have — and until this existed, that was the only outcome available.
  //
  // The notification deliberately carries no detail: it says a report was
  // filed and links to the queue, where identity and content are behind
  // requireAdmin(). A push preview appears on a lock screen.
  after(async () => {
    await dispatchToAdmins({
      key: "SAFETY_REPORT_FILED",
      vars: { reportId: report.id },
      dedupe: report.id,
    });
  });
}

export async function awardSafetyMilestone() {
  const { userId } = await auth();
  if (!userId) return;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) return;

  await db
    .insert(milestones)
    .values({ userId: user.id, type: "safety_module" })
    .onConflictDoNothing();
}
