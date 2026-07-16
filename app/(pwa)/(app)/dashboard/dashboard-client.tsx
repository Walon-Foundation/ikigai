"use client";

import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  ListChecks,
  MessageCircle,
  Shield,
  ShieldCheck,
  Star,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { BusyLabel } from "@/components/spinner";
import { stageName } from "@/lib/growth";
import { GuardianConsent, type GuardianRequest } from "./guardian-consent";
import { completeMyTask } from "./task-actions";

type Mentor = {
  displayName: string | null;
  bio: string | null;
  interestTags: string[] | null;
} | null;

type OpenTask = {
  id: string;
  title: string;
  description: string | null;
};

// A task the mentee can actually finish. These used to be inert divs — only the
// mentor could complete a task, so the mentee could see the work but not do
// anything about it, while tasks are what drive growth points and tree health.
function TaskCard({ task }: { task: OpenTask }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function complete() {
    setFailed(false);
    startTransition(async () => {
      try {
        await completeMyTask(task.id);
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{task.title}</p>
      {task.description && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}
      <button
        type="button"
        onClick={complete}
        disabled={pending}
        aria-busy={pending}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
      >
        <BusyLabel pending={pending} busy="Saving…">
          <Check className="size-3.5" />
          Mark done
        </BusyLabel>
      </button>
      {failed && (
        <p className="mt-1.5 text-[11px] font-semibold text-destructive">
          Couldn&apos;t save that — try again.
        </p>
      )}
    </div>
  );
}

type MenteeData = {
  activeMentorship: {
    id: string;
    status: string | null;
    matchScore: number | null;
    lastActivityAt: string | null;
    mentor: Mentor;
  } | null;
  latestEntry: {
    content: string;
    createdAt: string;
    visibility: string;
  } | null;
  milestoneCount: number;
  tree: { health: number; stage: number };
  tasks: OpenTask[];
  guardianRequests: GuardianRequest[];
};

type MentorData = {
  active: {
    id: string;
    menteeId: string | null;
    menteeName: string;
    lastActivityAt: string | null;
  }[];
  pendingCount: number;
  isVerified: boolean;
};

type ParentData = {
  childEmail: string | null;
  status: string | null;
  inviteCode: string | null;
  child: { displayName: string; health: number; stage: number } | null;
};

type Props =
  | {
      userRole: "mentee";
      user: { displayName: string; growthLevel: number };
      menteeData: MenteeData;
      mentorData?: never;
      parentData?: never;
    }
  | {
      userRole: "mentor";
      user: { displayName: string; growthLevel: number };
      mentorData: MentorData;
      menteeData?: never;
      parentData?: never;
    }
  | {
      userRole: "parent";
      user: { displayName: string; growthLevel: number };
      parentData: ParentData;
      menteeData?: never;
      mentorData?: never;
    };

export function DashboardClient(props: Props) {
  if (props.userRole === "mentor")
    return <MentorView user={props.user} data={props.mentorData} />;
  if (props.userRole === "parent")
    return <ParentView user={props.user} data={props.parentData} />;
  return <MenteeView user={props.user} data={props.menteeData} />;
}

function HealthBar({ health }: { health: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-primary-muted/30">
      <div
        className={`h-2 rounded-full transition-all ${health < 50 ? "bg-accent" : "bg-primary-foreground"}`}
        style={{ width: `${Math.max(health, 4)}%` }}
      />
    </div>
  );
}

function MenteeView({
  user,
  data,
}: {
  user: { displayName: string; growthLevel: number };
  data: MenteeData;
}) {
  const wilting = data.tree.health < 50;

  return (
    <>
      <PageHeader showGreeting />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          {data.guardianRequests.length > 0 && (
            <GuardianConsent requests={data.guardianRequests} />
          )}

          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-muted">Your tree</p>
                <p className="font-display text-2xl font-black">
                  {stageName(data.tree.stage)}
                </p>
              </div>
              <TreePine className="size-10 text-primary-muted/50" />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-primary-muted">
                <span>{wilting ? "Wilting" : "Vitality"}</span>
                <span>{data.tree.health}%</span>
              </div>
              <HealthBar health={data.tree.health} />
            </div>
            <Link
              href="/journey"
              className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-muted hover:text-primary-foreground"
            >
              View Growth Tree <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Open tasks", value: String(data.tasks.length) },
              { label: "Milestones", value: String(data.milestoneCount) },
              {
                label: "Mentor",
                value:
                  data.activeMentorship?.status === "active"
                    ? "Active"
                    : data.activeMentorship?.status === "requested"
                      ? "Pending"
                      : "None",
              },
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

          {data.tasks.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="size-3.5" /> Tasks from your mentor
              </p>
              <div className="space-y-2">
                {data.tasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}

          {data.activeMentorship?.mentor ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Mentor
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                  {data.activeMentorship.mentor.displayName
                    ?.split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("") ?? "M"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {data.activeMentorship.mentor.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.activeMentorship.mentor.interestTags?.join(", ")}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary-muted/20 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                  {data.activeMentorship.status !== "active" && (
                    <Clock className="size-3" />
                  )}
                  {data.activeMentorship.status}
                </span>
              </div>
              {data.activeMentorship.status === "active" ? (
                <Link
                  href={`/mentorship/${data.activeMentorship.id}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  <MessageCircle className="size-4" /> Send a message
                </Link>
              ) : (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Waiting for your mentor to accept your request.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mentorship
              </p>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have a mentor yet.
              </p>
              <Link
                href="/mentorship"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Find a Mentor
              </Link>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Modules
            </p>
            <div className="space-y-3">
              {[
                {
                  href: "/pad-her-power",
                  icon: Heart,
                  title: "Pad Her Power",
                },
                { href: "/safety", icon: Shield, title: "Safety Awareness" },
              ].map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted/20 text-primary">
                    <mod.icon className="size-5" />
                  </div>
                  <p className="flex-1 text-sm font-semibold text-foreground">
                    {mod.title}
                  </p>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {data.latestEntry && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Journal
                </p>
                <Link
                  href="/journal"
                  className="text-xs font-medium text-primary"
                >
                  See all
                </Link>
              </div>
              <Link
                href="/journal"
                className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="size-3" />
                  <span>
                    {new Date(data.latestEntry.createdAt).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "long" },
                    )}
                  </span>
                  <span>·</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                    {data.latestEntry.visibility.replace("_", " ")}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-foreground">
                  {data.latestEntry.content}
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MentorView({
  user,
  data,
}: {
  user: { displayName: string; growthLevel: number };
  data: MentorData;
}) {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="font-display text-2xl font-black">
              {user.displayName}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-muted">
              {data.isVerified ? (
                <>
                  <ShieldCheck className="size-4" /> Verified Mentor
                </>
              ) : (
                <>
                  <Clock className="size-4" /> Application under review — you
                  cannot be matched yet
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">
                {data.active.length}
              </p>
              <p className="text-xs text-muted-foreground">Active mentees</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">
                {data.pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">Pending requests</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My Mentees
            </p>
            {data.active.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No active mentees yet.{" "}
                {data.pendingCount > 0
                  ? "Review your pending requests to get started."
                  : !data.isVerified
                    ? "Your account is pending verification."
                    : ""}
              </div>
            ) : (
              <div className="space-y-3">
                {data.active.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mentor-portal/${m.menteeId}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                      {m.menteeName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("") || "M"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {m.menteeName}
                      </p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/mentor-portal"
            className="flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            <Users className="size-4" /> View all mentees
          </Link>
        </div>
      </div>
    </>
  );
}

function ParentView({
  user,
  data,
}: {
  user: { displayName: string; growthLevel: number };
  data: ParentData;
}) {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm text-primary-muted">Guardian Dashboard</p>
            <p className="font-display text-2xl font-black">
              {user.displayName}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My Child
            </p>
            {data.child ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">
                    {data.child.displayName}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {stageName(data.child.stage)}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${data.child.health < 50 ? "bg-accent" : "bg-primary"}`}
                    style={{ width: `${Math.max(data.child.health, 4)}%` }}
                  />
                </div>
                <Link
                  href="/parent-portal"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  View progress
                </Link>
              </div>
            ) : data.status === "pending" ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" /> Waiting for{" "}
                  <span className="font-semibold text-foreground">
                    {data.childEmail}
                  </span>{" "}
                  to accept.
                </p>
                {data.inviteCode && (
                  <>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Share this code with your child to link accounts:
                    </p>
                    <div className="rounded-xl border border-border bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
                      {data.inviteCode}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm text-muted-foreground">
                  No child linked yet.
                </p>
                <Link
                  href="/onboarding/parent/link"
                  className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Link child&apos;s account
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/parent-portal/mentors"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <Star className="size-6 text-primary" />
              <p className="text-xs font-semibold text-foreground">Mentors</p>
            </Link>
            <Link
              href="/parent-portal/payments"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <CreditCard className="size-6 text-primary" />
              <p className="text-xs font-semibold text-foreground">Payments</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
