"use client";

import {
  BookOpen,
  ChevronRight,
  MessageCircle,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

type Mentor = {
  displayName: string | null;
  bio: string | null;
  interestTags: string[] | null;
} | null;

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
};

type MentorData = {
  activeMenteeships: {
    id: string;
    status: string | null;
    lastActivityAt: string | null;
    menteeId: string | null;
  }[];
  isVerified: boolean;
};

type ParentData = {
  childEmail: string | null;
  childLinked: boolean;
  inviteCode: string | null;
};

type Props =
  | {
      role: "mentee";
      user: { displayName: string; growthLevel: number };
      menteeData: MenteeData;
      mentorData?: never;
      parentData?: never;
    }
  | {
      role: "mentor";
      user: { displayName: string; growthLevel: number };
      mentorData: MentorData;
      menteeData?: never;
      parentData?: never;
    }
  | {
      role: "parent";
      user: { displayName: string; growthLevel: number };
      parentData: ParentData;
      menteeData?: never;
      mentorData?: never;
    };

export function DashboardClient(props: Props) {
  if (props.role === "mentor")
    return <MentorView user={props.user} data={props.mentorData} />;
  if (props.role === "parent")
    return <ParentView user={props.user} data={props.parentData} />;
  return <MenteeView user={props.user} data={props.menteeData} />;
}

function MenteeView({
  user,
  data,
}: {
  user: { displayName: string; growthLevel: number };
  data: MenteeData;
}) {
  const nextLevelMilestones = 6;

  return (
    <>
      <PageHeader showGreeting />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-muted">Growth Level</p>
                <p className="font-display text-2xl font-black">
                  Explorer — Level {user.growthLevel}
                </p>
              </div>
              <TreePine className="size-10 text-primary-muted/50" />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-primary-muted">
                <span>Progress to Advocate</span>
                <span>
                  {data.milestoneCount} / {nextLevelMilestones} milestones
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-primary-muted/30">
                <div
                  className="h-2 rounded-full bg-primary-foreground transition-all"
                  style={{
                    width: `${Math.min((data.milestoneCount / nextLevelMilestones) * 100, 100)}%`,
                  }}
                />
              </div>
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
              { label: "Milestones", value: String(data.milestoneCount) },
              { label: "Level", value: String(user.growthLevel) },
              {
                label: "Mentor",
                value: data.activeMentorship ? "Active" : "None",
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
                <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-xs font-medium text-primary">
                  {data.activeMentorship.status}
                </span>
              </div>
              <Link
                href={`/mentorship/${data.activeMentorship.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                <MessageCircle className="size-4" /> Send a message
              </Link>
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
                { href: "/pad-her-power", icon: "💚", title: "Pad Her Power" },
                { href: "/safety", icon: "🛡️", title: "Safety Awareness" },
              ].map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <span className="text-2xl">{mod.icon}</span>
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
                      {
                        day: "numeric",
                        month: "long",
                      },
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
            <p className="mt-1 text-sm text-primary-muted">
              {data.isVerified
                ? "✓ Verified Mentor"
                : "⏳ Application under review — you cannot be matched yet"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">
                {data.activeMenteeships.length}
              </p>
              <p className="text-xs text-muted-foreground">Active Mentees</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">
                0
              </p>
              <p className="text-xs text-muted-foreground">
                Sessions this month
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My Mentees
            </p>
            {data.activeMenteeships.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No active mentees yet.{" "}
                {!data.isVerified && "Your account is pending verification."}
              </div>
            ) : (
              <div className="space-y-3">
                {data.activeMenteeships.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mentor-portal/${m.menteeId}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                      M
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Mentee
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {m.status}
                      </p>
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
            {data.childLinked ? (
              <div>
                <p className="text-sm text-foreground">
                  ✓ Linked to{" "}
                  <span className="font-semibold">{data.childEmail}</span>
                </p>
                <Link
                  href="/parent-portal"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  View progress
                </Link>
              </div>
            ) : data.inviteCode ? (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Invite sent to{" "}
                  <span className="font-semibold">{data.childEmail}</span>
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Share this code with your child to link accounts:
                </p>
                <div className="rounded-xl border border-border bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
                  {data.inviteCode}
                </div>
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
              className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/40"
            >
              <p className="text-2xl">🤝</p>
              <p className="mt-1 text-xs font-semibold text-foreground">
                Mentors
              </p>
            </Link>
            <Link
              href="/parent-portal/payments"
              className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/40"
            >
              <p className="text-2xl">💳</p>
              <p className="mt-1 text-xs font-semibold text-foreground">
                Payments
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
