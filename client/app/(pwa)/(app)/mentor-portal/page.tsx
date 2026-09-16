import { and, eq } from "drizzle-orm";
import { ChevronRight, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorships, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { MENTOR_CAPACITY } from "@/lib/match";
import { PendingRequests, type RequestItem } from "./requests-client";

export default async function MentorPortalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "mentor") redirect("/dashboard");

  // An approved mentor is the only one who gets a portal. Everyone else gets
  // told where they stand, rather than a working-looking screen whose every
  // button fails — the server actions refuse them anyway (see
  // requireApprovedMentor in lib/db-user.ts), and a refusal with no explanation
  // reads as the app being broken.
  if (!user.verifiedAt)
    return <AwaitingApproval rejected={!!user.rejectedAt} />;

  // All mentorships for this mentor, joined to the mentee for real names/tags.
  const rows = await db
    .select({
      id: mentorships.id,
      status: mentorships.status,
      matchScore: mentorships.matchScore,
      lastActivityAt: mentorships.lastActivityAt,
      menteeId: mentorships.menteeId,
      menteeName: users.displayName,
      interestTags: users.interestTags,
    })
    .from(mentorships)
    .innerJoin(users, eq(mentorships.menteeId, users.id))
    .where(eq(mentorships.mentorId, user.id));

  const active = rows.filter((r) => r.status === "active");
  const requests: RequestItem[] = rows
    .filter((r) => r.status === "requested")
    .map((r) => ({
      id: r.id,
      menteeName: r.menteeName ?? "Mentee",
      interestTags: r.interestTags,
      matchScore: r.matchScore,
    }));

  const atCapacity = active.length >= MENTOR_CAPACITY;

  return (
    <>
      <PageHeader title="My Mentees" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <PendingRequests requests={requests} atCapacity={atCapacity} />

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active mentees
          </p>
          <span className="text-xs text-muted-foreground">
            {active.length} / {MENTOR_CAPACITY}
          </span>
        </div>

        {active.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No active mentees yet. Accept a request to start mentoring.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((m) => {
              const initials =
                m.menteeName
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") ?? "M";
              return (
                <Link
                  key={m.id}
                  href={`/mentor-portal/${m.menteeId}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {m.menteeName ?? "Mentee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active ·{" "}
                      {m.lastActivityAt
                        ? new Date(m.lastActivityAt).toLocaleDateString("en-GB")
                        : "no activity yet"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * What a mentor sees before approval, and after a rejection.
 *
 * The rejection reason is deliberately NOT shown. It is an internal note the
 * admin screen labels as such, written for whoever picks up the follow-up, and
 * a safeguarding decision is not something to argue with an applicant through a
 * UI. They are pointed at a human instead.
 */
function AwaitingApproval({ rejected }: { rejected: boolean }) {
  const Icon = rejected ? ShieldAlert : Clock;
  return (
    <>
      <PageHeader title="My Mentees" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Icon className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="font-display mb-2 text-xl font-bold text-foreground">
            {rejected
              ? "Your application wasn't approved"
              : "Your application is under review"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {rejected ? (
              <>
                We can&apos;t pair you with a mentee at the moment. If you think
                this is a mistake, contact the ikigai team and someone will look
                at it again.
              </>
            ) : (
              <>
                Our team is checking the ID and CV you submitted. Mentors are
                verified before being matched with a young person — it usually
                takes about 48 hours, and you&apos;ll be notified as soon as
                it&apos;s done.
              </>
            )}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-1 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
