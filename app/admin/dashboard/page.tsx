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
import { MOCK_ADMIN_STATS } from "@/lib/mock-data";

const KPI_CARDS = [
  {
    label: "Total Users",
    value: MOCK_ADMIN_STATS.totalUsers,
    sub: `${MOCK_ADMIN_STATS.mentees} mentees · ${MOCK_ADMIN_STATS.mentors} mentors`,
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
    href: "/admin/users",
  },
  {
    label: "Active Mentorships",
    value: MOCK_ADMIN_STATS.activeMentorships,
    sub: "Ongoing connections",
    icon: Activity,
    color: "text-primary",
    bg: "bg-primary/10",
    href: null,
  },
  {
    label: "Pending Mentors",
    value: MOCK_ADMIN_STATS.pendingMentors,
    sub: "Awaiting verification",
    icon: UserCheck,
    color: "text-accent",
    bg: "bg-accent/10",
    href: "/admin/mentors",
  },
  {
    label: "Pending Schools",
    value: MOCK_ADMIN_STATS.pendingSchools,
    sub: "Awaiting vetting",
    icon: School,
    color: "text-accent",
    bg: "bg-accent/10",
    href: "/admin/schools",
  },
  {
    label: "Open Reports",
    value: MOCK_ADMIN_STATS.openReports,
    sub: "Needs attention",
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    href: "/admin/reports",
  },
  {
    label: "Schools Established",
    value: MOCK_ADMIN_STATS.schoolsEstablished,
    sub: "Verified clubs active",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    href: "/admin/analytics",
  },
];

const ACTIVITY_FEED = [
  { time: "10 min ago", text: "Kadiatu Fofanah submitted mentor application", type: "mentor" },
  { time: "1 hour ago", text: "New safety report filed by Isata Mansaray", type: "report" },
  { time: "2 hours ago", text: "Christo-Rama Secondary School registered", type: "school" },
  { time: "Yesterday", text: "Abu Kamara approved as verified mentor", type: "mentor" },
  { time: "Yesterday", text: "Safety report #r2 marked as resolved", type: "report" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
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
            Recent Activity
          </h2>
          <div className="space-y-3">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Queues
          </h2>
          <div className="space-y-3">
            {[
              { href: "/admin/mentors", label: "Mentor Verification", count: MOCK_ADMIN_STATS.pendingMentors, urgent: false },
              { href: "/admin/schools", label: "School Vetting", count: MOCK_ADMIN_STATS.pendingSchools, urgent: false },
              { href: "/admin/reports", label: "Safety Reports", count: MOCK_ADMIN_STATS.openReports, urgent: true },
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
