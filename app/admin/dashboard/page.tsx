import Link from "next/link";
import {
  Users,
  UserCheck,
  School,
  AlertTriangle,
  Activity,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { db } from "@/db/db";
import { users, mentorships, schools, safetyReports } from "@/db/schema";
import { count, eq, isNull, isNotNull, and, desc } from "drizzle-orm";

export default async function AdminDashboardPage() {
  const [
    [{ total }],
    [{ menteeCount }],
    [{ mentorCount }],
    [{ clubLeadCount }],
    [{ activeMentorships }],
    [{ pendingMentors }],
    [{ pendingSchools }],
    [{ openReports }],
    [{ schoolsEstablished }],
    recentUsers,
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ menteeCount: count() }).from(users).where(eq(users.role, "mentee")),
    db.select({ mentorCount: count() }).from(users).where(eq(users.role, "mentor")),
    db.select({ clubLeadCount: count() }).from(users).where(eq(users.role, "club_lead")),
    db.select({ activeMentorships: count() }).from(mentorships).where(eq(mentorships.status, "active")),
    db.select({ pendingMentors: count() }).from(users).where(and(eq(users.role, "mentor"), isNull(users.verifiedAt))),
    db.select({ pendingSchools: count() }).from(schools).where(isNull(schools.verifiedAt)),
    db.select({ openReports: count() }).from(safetyReports).where(isNull(safetyReports.resolvedAt)),
    db.select({ schoolsEstablished: count() }).from(schools).where(isNotNull(schools.verifiedAt)),
    db.select({ displayName: users.displayName, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(5),
  ]);

  const stats = {
    totalUsers: Number(total),
    mentees: Number(menteeCount),
    mentors: Number(mentorCount),
    clubLeads: Number(clubLeadCount),
    activeMentorships: Number(activeMentorships),
    pendingMentors: Number(pendingMentors),
    pendingSchools: Number(pendingSchools),
    openReports: Number(openReports),
    schoolsEstablished: Number(schoolsEstablished),
  };

  const KPI_CARDS = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      sub: `${stats.mentees} mentees · ${stats.mentors} mentors`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/users",
    },
    {
      label: "Active Mentorships",
      value: stats.activeMentorships,
      sub: "Ongoing connections",
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
      href: null,
    },
    {
      label: "Pending Mentors",
      value: stats.pendingMentors,
      sub: "Awaiting verification",
      icon: UserCheck,
      color: "text-accent",
      bg: "bg-accent/10",
      href: "/admin/mentors",
    },
    {
      label: "Pending Schools",
      value: stats.pendingSchools,
      sub: "Awaiting vetting",
      icon: School,
      color: "text-accent",
      bg: "bg-accent/10",
      href: "/admin/schools",
    },
    {
      label: "Open Reports",
      value: stats.openReports,
      sub: "Needs attention",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      href: "/admin/reports",
    },
    {
      label: "Schools Established",
      value: stats.schoolsEstablished,
      sub: "Verified clubs active",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/analytics",
    },
  ];

  function timeAgo(date: Date | null): string {
    if (!date) return "Recently";
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview —{" "}
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CARDS.map((card) => {
          const inner = (
            <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`size-5 ${card.color}`} />
                </div>
                {card.href && (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </div>
              <p className={`mt-3 font-display text-3xl font-black ${card.color}`}>
                {card.value}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {card.label}
              </p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
          );

          return card.href ? (
            <Link key={card.label} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Recent Users
          </h2>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              recentUsers.map((u, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm text-foreground">
                      New user: {u.displayName ?? "Unknown"} joined
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(u.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Queues
          </h2>
          <div className="space-y-3">
            {[
              { href: "/admin/mentors", label: "Mentor Verification", count: stats.pendingMentors, urgent: false },
              { href: "/admin/schools", label: "School Vetting", count: stats.pendingSchools, urgent: false },
              { href: "/admin/reports", label: "Safety Reports", count: stats.openReports, urgent: true },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/40 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.urgent && item.count > 0
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.count} pending
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
