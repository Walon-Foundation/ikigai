import { and, desc, eq } from "drizzle-orm";
import { ChevronLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { growthTrees, mentorships, tasks, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { stageName } from "@/lib/growth";
import { getSharedJournals } from "./feedback-actions";
import { FeedbackForm } from "./feedback-client";
import { MenteeTasks, type TaskItem } from "./mentee-tasks";

export default async function MenteeDetailPage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const { menteeId } = await params;
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "mentor") redirect("/dashboard");

  // The mentor may only view a mentee they have an active mentorship with.
  const [mentorship] = await db
    .select({ id: mentorships.id, status: mentorships.status })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.menteeId, menteeId),
        eq(mentorships.mentorId, user.id),
        eq(mentorships.status, "active"),
      ),
    )
    .limit(1);
  if (!mentorship) redirect("/mentor-portal");

  const [mentee] = await db
    .select({
      displayName: users.displayName,
      interestTags: users.interestTags,
    })
    .from(users)
    .where(eq(users.id, menteeId))
    .limit(1);
  if (!mentee) redirect("/mentor-portal");

  const [tree] = await db
    .select()
    .from(growthTrees)
    .where(eq(growthTrees.userId, menteeId))
    .limit(1);

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.mentorshipId, mentorship.id))
    .orderBy(desc(tasks.createdAt));

  const sharedJournals = await getSharedJournals(menteeId);

  const taskItems: TaskItem[] = taskRows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    growthPoints: t.growthPoints,
    createdAt: t.createdAt?.toISOString() ?? null,
  }));

  const health = tree?.health ?? 100;
  const stage = tree?.stage ?? 1;
  const completed = taskItems.filter((t) => t.status === "completed").length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/mentor-portal"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> My Mentees
      </Link>

      <div className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-xl font-bold">
          {mentee.displayName
            ?.split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("") ?? "M"}
        </div>
        <p className="mt-3 font-display text-2xl font-black">
          {mentee.displayName ?? "Mentee"}
        </p>
        <p className="text-sm text-primary-muted">
          {stageName(stage)} · {completed} task
          {completed !== 1 ? "s" : ""} completed
        </p>
        {mentee.interestTags && mentee.interestTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mentee.interestTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-[11px] font-medium text-primary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Tree health</span>
            <span className="text-muted-foreground">{health}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className={`h-3 rounded-full transition-all ${
                health < 50 ? "bg-earth" : "bg-primary"
              }`}
              style={{ width: `${health}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {health < 50
              ? "Their tree is wilting. Completing tasks brings it back to life."
              : "Completing tasks grows the tree; failed tasks make it wilt."}
          </p>
        </div>

        <MenteeTasks mentorshipId={mentorship.id} initialTasks={taskItems} />

        {/* Shared journals + mentor feedback */}
        {sharedJournals.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-base font-bold text-foreground">
              Shared journal entries
            </h2>
            <div className="space-y-4">
              {sharedJournals.map((e) => (
                <div
                  key={e.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-sm text-foreground">{e.content}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {e.createdAt
                      ? new Date(e.createdAt).toLocaleDateString("en-GB")
                      : ""}
                  </p>
                  {e.feedback.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {e.feedback.map((f) => (
                        <p
                          key={f.id}
                          className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs text-foreground"
                        >
                          {f.comment}
                        </p>
                      ))}
                    </div>
                  )}
                  <FeedbackForm entryId={e.id} menteeId={menteeId} />
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href={`/mentorship/${mentorship.id}/verify`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground"
        >
          Verify in-person meetings
        </Link>

        <Link
          href={`/mentorship/${mentorship.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          <MessageCircle className="size-4" /> Open Chat
        </Link>
      </div>
    </div>
  );
}
