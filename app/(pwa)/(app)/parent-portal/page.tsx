import { and, eq } from "drizzle-orm";
import { Clock, CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GrowthTree } from "@/components/growth-tree";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import {
  eventAttendance,
  events,
  growthTrees,
  mentorships,
  milestones,
  tasks,
  users,
} from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { stageName } from "@/lib/growth";
import { acceptedChildForParent, latestLinkForParent } from "@/lib/guardian";
import { getMenteeProgress } from "@/lib/progress";

export default async function ParentPortalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  const [link, child] = await Promise.all([
    latestLinkForParent(user.id),
    acceptedChildForParent(user.id),
  ]);

  // Not yet consented — show status only, never the child's data.
  if (!child) {
    return (
      <>
        <PageHeader title="My Child" />
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            {link?.status === "pending" ? (
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Clock className="size-4 text-earth" /> Waiting for consent
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ve sent a request to{" "}
                  <span className="font-semibold">{link.childEmail}</span>. You
                  will see their growth and progress once they accept.
                </p>
                {link.inviteCode && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Or share this invite code:
                    </p>
                    <div className="rounded-xl bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
                      {link.inviteCode}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  No child linked yet.
                </p>
                <Link
                  href="/onboarding/parent/link"
                  className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Link child&apos;s account
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Consented — load progress, attendance, tree, milestones, mentorship all at
  // once (they're independent) instead of in a waterfall.
  const [
    progress,
    attendanceRows,
    treeRows,
    milestoneRows,
    activeMentorshipRows,
  ] = await Promise.all([
    getMenteeProgress(child),
    db
      .select({
        title: events.title,
        startsAt: events.startsAt,
        status: eventAttendance.status,
      })
      .from(eventAttendance)
      .innerJoin(events, eq(eventAttendance.eventId, events.id))
      .where(eq(eventAttendance.userId, child.id))
      .orderBy(events.startsAt),
    db
      .select()
      .from(growthTrees)
      .where(eq(growthTrees.userId, child.id))
      .limit(1),
    db
      .select({ id: milestones.id })
      .from(milestones)
      .where(eq(milestones.userId, child.id)),
    db
      .select({ id: mentorships.id, mentorId: mentorships.mentorId })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, child.id),
          eq(mentorships.status, "active"),
        ),
      )
      .limit(1),
  ]);

  const tree = treeRows[0] ?? null;
  const health = tree?.health ?? 100;
  const stage = tree?.stage ?? 1;

  let mentorName: string | null = null;
  let completedTasks = 0;
  const activeMentorship = activeMentorshipRows[0] ?? null;
  if (activeMentorship) {
    if (activeMentorship.mentorId) {
      const [m] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, activeMentorship.mentorId))
        .limit(1);
      mentorName = m?.displayName ?? null;
    }
    const done = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.mentorshipId, activeMentorship.id),
          eq(tasks.status, "completed"),
        ),
      );
    completedTasks = done.length;
  }

  return (
    <>
      <PageHeader title="My Child" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm text-primary-muted">Following</p>
            <p className="font-display text-2xl font-black">
              {child.displayName}
            </p>
            <p className="text-sm text-primary-muted">{stageName(stage)}</p>
          </div>

          <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-6">
            <GrowthTree
              completedCount={completedTasks}
              level={1}
              health={health}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {health < 50
                ? "Their tree is wilting — encourage them to complete their tasks."
                : "Growing well through completed tasks."}
            </p>
          </div>

          {/* Roadmap completion */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">
                Roadmap · {progress.currentPhase.name}
              </span>
              <span className="text-muted-foreground">{progress.percent}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Vitality", value: `${health}%` },
              { label: "Tasks done", value: String(completedTasks) },
              { label: "Milestones", value: String(milestoneRows.length) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <p className="font-display text-xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mentor
            </p>
            {mentorName ? (
              <p className="text-sm text-foreground">{mentorName}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No mentor matched yet.
              </p>
            )}
          </div>

          {/* Attendance records */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance
            </p>
            {attendanceRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activities registered yet.
              </p>
            ) : (
              <div className="space-y-2">
                {attendanceRows.map((a) => (
                  <div
                    key={`${a.title}-${a.startsAt?.toISOString()}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{a.title}</span>
                    <span
                      className={
                        a.status === "attended"
                          ? "text-xs font-semibold text-primary"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {a.status === "attended" ? "Attended" : "Registered"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/parent-portal/mentors"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <Star className="size-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Mentor</p>
            </Link>
            <Link
              href="/parent-portal/payments"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <CreditCard className="size-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Payments</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
