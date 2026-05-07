"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TreePine,
  BookOpen,
  Shield,
  MessageCircle,
  ChevronRight,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_USER,
  MOCK_MENTORSHIPS,
  MOCK_JOURNAL_ENTRIES,
  MOCK_SCHOOLS,
  MOCK_SCHOOL_MEMBERS,
} from "@/lib/mock-data";

type Role = "mentee" | "mentor" | "club_lead";

const ROLE_LABELS: Record<Role, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  club_lead: "Club Lead",
};

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("mentee");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Good morning, Aminata 🌱
          </h1>
          <p className="text-sm text-muted-foreground">
            Wednesday, 7 May 2026
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
          AK
        </div>
      </div>

      {/* Demo Role Switcher */}
      <div className="mb-6 flex rounded-xl border border-border bg-muted p-1">
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-all",
              role === r
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {role === "mentee" && <MenteeView />}
      {role === "mentor" && <MentorView />}
      {role === "club_lead" && <ClubLeadView />}
    </div>
  );
}

function MenteeView() {
  const mentorship = MOCK_MENTORSHIPS[0];

  return (
    <div className="space-y-4">
      {/* Growth Level */}
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-muted">Growth Level</p>
            <p className="font-display text-2xl font-black">
              Explorer — Level 1
            </p>
          </div>
          <TreePine className="size-10 text-primary-muted/50" />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-primary-muted">
            <span>Progress to Advocate</span>
            <span>3 / 6 milestones</span>
          </div>
          <div className="h-2 w-full rounded-full bg-primary-muted/30">
            <div className="h-2 w-1/2 rounded-full bg-primary-foreground" />
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
          { label: "Journal streak", value: "4 days" },
          { label: "Days active", value: "32" },
          { label: "Mentor sessions", value: "6" },
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

      {/* Your Mentor */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Mentor
        </p>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
            DS
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {mentorship.mentor.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {mentorship.mentor.interestTags.join(", ")}
            </p>
          </div>
          <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-xs font-medium text-primary">
            {mentorship.status}
          </span>
        </div>
        <Link
          href={`/mentorship/${mentorship.id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-muted/10"
        >
          <MessageCircle className="size-4" />
          Send a message
        </Link>
      </div>

      {/* Active Modules */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Active Modules
        </p>
        <div className="space-y-3">
          {[
            { href: "/pad-her-power", icon: "💚", title: "Pad Her Power", progress: 0, total: 6, color: "bg-earth" },
            { href: "/safety", icon: "🛡️", title: "Safety Awareness", progress: 0, total: 4, color: "bg-primary" },
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
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-1.5 rounded-full",
                      mod.color
                    )}
                    style={{
                      width: `${(mod.progress / mod.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mod.progress}/{mod.total} sections
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Journal */}
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
            <span>6 May 2026</span>
            <span>·</span>
            <span className="rounded-full bg-muted px-2 py-0.5">Private</span>
          </div>
          <p className="line-clamp-2 text-sm text-foreground">
            {MOCK_JOURNAL_ENTRIES[0].content}
          </p>
        </Link>
      </div>
    </div>
  );
}

function MentorView() {
  const mentees = [
    { name: "Aminata Koroma", lastActivity: "Today", level: 1, initials: "AK" },
    { name: "Isata Mansaray", lastActivity: "2 days ago", level: 2, initials: "IM" },
    { name: "Sorie Kamara", lastActivity: "5 days ago", level: 1, initials: "SK" },
  ];

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="font-display text-2xl font-black">
          You&apos;re guiding 3 mentees
        </p>
        <p className="mt-1 text-sm text-primary-muted">
          2 sessions scheduled this week
        </p>
      </div>

      {/* Pending Icebreaker */}
      <div className="rounded-2xl border-2 border-accent/40 bg-accent-pale/30 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-earth">
              New Request
            </p>
            <p className="mt-1 font-semibold text-foreground">
              Mariama Turay wants to connect
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Interests: Technology, Education
            </p>
          </div>
          <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-foreground">
            Icebreaker
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Accept
          </button>
          <button className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
            Decline
          </button>
        </div>
      </div>

      {/* Mentees List */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          My Mentees
        </p>
        <div className="space-y-3">
          {mentees.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                {m.initials}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{m.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>Active {m.lastActivity}</span>
                </div>
              </div>
              <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-xs font-medium text-primary">
                Lvl {m.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClubLeadView() {
  const school = MOCK_SCHOOLS[0];

  return (
    <div className="space-y-4">
      {/* School Card */}
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm text-primary-muted">Your School</p>
        <p className="font-display text-xl font-black">{school.name}</p>
        <div className="mt-3 flex items-center gap-2">
          <Users className="size-4 text-primary-muted" />
          <span className="text-sm text-primary-muted">
            {school.memberCount} members
          </span>
          {school.verifiedAt && (
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-medium">
              Verified ✓
            </span>
          )}
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Club Members
          </p>
          <Link href="/school" className="text-xs font-medium text-primary">
            Manage
          </Link>
        </div>
        <div className="space-y-3">
          {MOCK_SCHOOL_MEMBERS.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary-muted/30 font-display text-xs font-bold text-primary">
                {m.displayName.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 text-sm font-medium text-foreground">
                {m.displayName}
              </div>
              <span className="text-xs text-muted-foreground">
                Level {m.growthLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Announcements
        </p>
        <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          No announcements yet. Post one to keep your club engaged.
        </div>
        <button className="mt-3 w-full rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-muted/10">
          Post Announcement
        </button>
      </div>
    </div>
  );
}
