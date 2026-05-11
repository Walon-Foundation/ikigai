"use client";

import { BookOpen, ChevronRight, MessageCircle, TreePine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type Role = "mentee" | "mentor" | "club_lead";
const ROLE_LABELS: Record<Role, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  club_lead: "Club Lead",
};

type Mentor = {
  displayName: string | null;
  bio: string | null;
  interestTags: string[] | null;
} | null;
type Mentorship = {
  id: string;
  status: string | null;
  matchScore: number | null;
  lastActivityAt: string | null;
  mentor: Mentor;
} | null;

type Props = {
  user: { displayName: string; role: string; growthLevel: number };
  activeMentorship: Mentorship;
  latestEntry: {
    content: string;
    createdAt: string;
    visibility: string;
  } | null;
  milestoneCount: number;
};

export function DashboardClient({
  user,
  activeMentorship,
  latestEntry,
  milestoneCount,
}: Props) {
  const [role, setRole] = useState<Role>(
    (user.role as Role) in ROLE_LABELS ? (user.role as Role) : "mentee",
  );

  return (
    <>
      <PageHeader showGreeting />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Role Switcher */}
        <div className="mb-6 flex rounded-xl border border-border bg-muted p-1">
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold transition-all",
                role === r
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {role === "mentee" && (
          <MenteeView
            user={user}
            activeMentorship={activeMentorship}
            latestEntry={latestEntry}
            milestoneCount={milestoneCount}
          />
        )}
        {role === "mentor" && <MentorView />}
        {role === "club_lead" && <ClubLeadView />}
      </div>
    </>
  );
}

function MenteeView({
  user,
  activeMentorship,
  latestEntry,
  milestoneCount,
}: Omit<Props, "user"> & { user: Props["user"] }) {
  const nextLevelMilestones = 6;

  return (
    <div className="space-y-4">
      {/* Growth Level */}
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
              {milestoneCount} / {nextLevelMilestones} milestones
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-primary-muted/30">
            <div
              className="h-2 rounded-full bg-primary-foreground transition-all"
              style={{
                width: `${Math.min((milestoneCount / nextLevelMilestones) * 100, 100)}%`,
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Milestones", value: String(milestoneCount) },
          { label: "Level", value: String(user.growthLevel) },
          { label: "Mentor", value: activeMentorship ? "Active" : "None" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-3 text-center"
          >
            <p className="font-display text-xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Mentor card */}
      {activeMentorship?.mentor ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Mentor
          </p>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
              {activeMentorship.mentor.displayName
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") ?? "M"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {activeMentorship.mentor.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeMentorship.mentor.interestTags?.join(", ")}
              </p>
            </div>
            <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-xs font-medium text-primary">
              {activeMentorship.status}
            </span>
          </div>
          <Link
            href={`/mentorship/${activeMentorship.id}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-muted/10"
          >
            <MessageCircle className="size-4" />
            Send a message
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Find a Mentor
          </Link>
        </div>
      )}

      {/* Active Modules */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Active Modules
        </p>
        <div className="space-y-3">
          {[
            {
              href: "/pad-her-power",
              icon: "💚",
              title: "Pad Her Power",
              color: "bg-earth",
            },
            {
              href: "/safety",
              icon: "🛡️",
              title: "Safety Awareness",
              color: "bg-primary",
            },
          ].map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
            >
              <span className="text-2xl">{mod.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {mod.title}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Journal */}
      {latestEntry && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Journal
            </p>
            <Link href="/journal" className="text-xs font-medium text-primary">
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
                {new Date(latestEntry.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <span>·</span>
              <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                {latestEntry.visibility.replace("_", " ")}
              </span>
            </div>
            <p className="line-clamp-2 text-sm text-foreground">
              {latestEntry.content}
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}

function MentorView() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="font-display text-2xl font-black">Mentor Dashboard</p>
        <p className="mt-1 text-sm text-primary-muted">
          Keep up the great work
        </p>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          My Mentees
        </p>
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No active mentees yet.
        </div>
      </div>
    </div>
  );
}

function ClubLeadView() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm text-primary-muted">Your School</p>
        <p className="font-display text-xl font-black">Your Club</p>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Club Members
        </p>
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          View your school page to see members.
        </div>
      </div>
      <Link
        href="/school"
        className="block w-full rounded-full border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary-muted/10"
      >
        Manage School
      </Link>
    </div>
  );
}
