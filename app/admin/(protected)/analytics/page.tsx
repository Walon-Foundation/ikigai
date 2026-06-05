import { count, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/db";
import {
  eventAttendance,
  journalEntries,
  mentorships,
  messages,
  safetyReports,
  satisfactionSurveys,
  tasks,
  users,
} from "@/db/schema";

export default async function AdminAnalyticsPage() {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [{ total }],
    [{ menteeCount }],
    [{ mentorCount }],
    [{ clubLeadCount }],
    [{ openReports }],
    userTagRows,
    recentEntries,
    activeJournalUsers,
    activeMessageUsers,
    mentorsWithActive,
    [taskTotals],
    [attendanceTotals],
    [messagesRecent],
    [satisfaction],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db
      .select({ menteeCount: count() })
      .from(users)
      .where(eq(users.role, "mentee")),
    db
      .select({ mentorCount: count() })
      .from(users)
      .where(eq(users.role, "mentor")),
    db
      .select({ clubLeadCount: count() })
      .from(users)
      .where(eq(users.role, "club_lead")),
    db
      .select({ openReports: count() })
      .from(safetyReports)
      .where(isNull(safetyReports.resolvedAt)),
    db
      .select({ interestTags: users.interestTags })
      .from(users)
      .where(isNotNull(users.interestTags)),
    db
      .select({ createdAt: journalEntries.createdAt })
      .from(journalEntries)
      .where(gte(journalEntries.createdAt, fourWeeksAgo)),
    // Active users = distinct authors of journals/messages in last 30 days
    db
      .selectDistinct({ userId: journalEntries.userId })
      .from(journalEntries)
      .where(gte(journalEntries.createdAt, thirtyDaysAgo)),
    db
      .selectDistinct({ userId: messages.senderId })
      .from(messages)
      .where(gte(messages.createdAt, thirtyDaysAgo)),
    // Mentor retention = mentors holding at least one active mentorship
    db
      .selectDistinct({ mentorId: mentorships.mentorId })
      .from(mentorships)
      .where(eq(mentorships.status, "active")),
    // Task completion
    db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        failed: sql<number>`count(*) filter (where ${tasks.status} = 'failed')`,
      })
      .from(tasks),
    // Event attendance
    db
      .select({
        total: count(),
        attended: sql<number>`count(*) filter (where ${eventAttendance.status} = 'attended')`,
      })
      .from(eventAttendance),
    // Session frequency = messages in last 28 days
    db
      .select({ total: count() })
      .from(messages)
      .where(gte(messages.createdAt, fourWeeksAgo)),
    // Satisfaction
    db
      .select({
        avg: sql<number>`coalesce(avg(${satisfactionSurveys.score}), 0)`,
        responses: count(),
      })
      .from(satisfactionSurveys),
  ]);

  const totalUsers = Number(total);
  const mentees = Number(menteeCount);
  const mentors = Number(mentorCount);
  const clubLeads = Number(clubLeadCount);

  // --- Spec metrics --------------------------------------------------------
  const activeSet = new Set<string>();
  for (const r of activeJournalUsers) if (r.userId) activeSet.add(r.userId);
  for (const r of activeMessageUsers) if (r.userId) activeSet.add(r.userId);
  const activeUsers = activeSet.size;

  const retainedMentors = mentorsWithActive.filter((m) => m.mentorId).length;
  const mentorRetention =
    mentors > 0 ? Math.round((retainedMentors / mentors) * 100) : 0;

  const tasksCompleted = Number(taskTotals?.completed ?? 0);
  const tasksFailed = Number(taskTotals?.failed ?? 0);
  const resolvedTasks = tasksCompleted + tasksFailed;
  const completionRate =
    resolvedTasks > 0 ? Math.round((tasksCompleted / resolvedTasks) * 100) : 0;

  const attendanceTotal = Number(attendanceTotals?.total ?? 0);
  const attended = Number(attendanceTotals?.attended ?? 0);
  const attendanceRate =
    attendanceTotal > 0 ? Math.round((attended / attendanceTotal) * 100) : 0;

  const sessionsPerWeek =
    Math.round((Number(messagesRecent?.total ?? 0) / 4) * 10) / 10;
  const avgSatisfaction = Math.round(Number(satisfaction?.avg ?? 0) * 10) / 10;
  const satisfactionResponses = Number(satisfaction?.responses ?? 0);

  const metrics = [
    {
      label: "Active Users",
      value: String(activeUsers),
      sub: "Posted in last 30 days",
    },
    {
      label: "Mentor Retention",
      value: `${mentorRetention}%`,
      sub: `${retainedMentors} of ${mentors} mentors active`,
    },
    {
      label: "Task Completion",
      value: `${completionRate}%`,
      sub: `${tasksCompleted} done · ${tasksFailed} failed`,
    },
    {
      label: "Event Attendance",
      value: `${attendanceRate}%`,
      sub: `${attended} of ${attendanceTotal} attended`,
    },
    {
      label: "Session Frequency",
      value: String(sessionsPerWeek),
      sub: "Avg messages / week",
    },
    {
      label: "User Satisfaction",
      value: satisfactionResponses > 0 ? `${avgSatisfaction}/5` : "—",
      sub:
        satisfactionResponses > 0
          ? `${satisfactionResponses} responses`
          : "No responses yet",
    },
  ];

  // Interest tag counts — aggregate in JS
  const tagCounts: Record<string, number> = {};
  for (const { interestTags } of userTagRows) {
    for (const tag of interestTags ?? []) {
      const key = tag.toLowerCase();
      tagCounts[key] = (tagCounts[key] ?? 0) + 1;
    }
  }
  const maxTagCount = Math.max(...Object.values(tagCounts), 1);
  const interestTagData = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, cnt]) => ({
      tag: tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: cnt,
      pct: Math.round((cnt / maxTagCount) * 100),
    }));

  // Weekly journal counts — aggregate in JS
  function weekStart(d: Date): string {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - copy.getDay());
    return copy.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  }
  const weekCounts: Record<string, number> = {};
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weekCounts[weekStart(d)] = 0;
  }
  for (const { createdAt } of recentEntries) {
    if (createdAt) {
      const key = weekStart(createdAt);
      if (key in weekCounts) weekCounts[key] = (weekCounts[key] ?? 0) + 1;
    }
  }
  const weeklyJournals = Object.entries(weekCounts).map(([week, cnt]) => ({
    week,
    count: cnt,
  }));
  const maxWeekCount = Math.max(...Object.values(weekCounts), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform KPIs and trends
        </p>
      </div>

      {/* Spec metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="font-display text-2xl font-black text-primary">
              {m.value}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {m.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Headline cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Users"
          value={String(totalUsers)}
          sub="Registered on platform"
          barPct={100}
          color="bg-primary"
        />
        <StatCard
          label="Open Safety Reports"
          value={String(Number(openReports))}
          sub="Awaiting resolution"
          barPct={Number(openReports) > 0 ? 100 : 0}
          color="bg-destructive"
        />
        <StatCard
          label="Mentors"
          value={String(mentors)}
          sub="Of total users"
          barPct={totalUsers > 0 ? Math.round((mentors / totalUsers) * 100) : 0}
          color="bg-primary-light"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* User Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            User Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: "Mentees", count: mentees, color: "bg-primary" },
              { label: "Mentors", count: mentors, color: "bg-primary-light" },
              { label: "Club Leads", count: clubLeads, color: "bg-accent" },
            ].map((item) => {
              const pct =
                totalUsers > 0
                  ? Math.round((item.count / totalUsers) * 100)
                  : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Journal Entries / Week */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">
            Journal Entries / Week
          </h2>
          <p className="mb-6 text-xs text-muted-foreground">Last 4 weeks</p>
          <div className="flex items-end gap-4 h-32">
            {weeklyJournals.map((w) => {
              const heightPct =
                maxWeekCount > 0
                  ? Math.max(
                      (w.count / maxWeekCount) * 100,
                      w.count > 0 ? 8 : 4,
                    )
                  : 4;
              return (
                <div
                  key={w.week}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className="w-full flex flex-col justify-end"
                    style={{ height: "100px" }}
                  >
                    <div
                      className="w-full rounded-t-md bg-primary/60 transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${w.count} entries`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-foreground">
                      {w.count}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {w.week}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Interest Tags */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Interest Tags
          </h2>
          {interestTagData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tag analytics will populate as more users complete onboarding.
            </p>
          ) : (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {interestTagData.map((item) => (
                <div key={item.tag}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {item.tag}
                    </span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  barPct,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  barPct: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-display text-3xl font-black text-primary">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  );
}
