import { and, eq } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
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
