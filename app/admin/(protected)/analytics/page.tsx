import { count, countDistinct, eq, gte, isNull, sql } from "drizzle-orm";
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

// Sunday-aligned week starts, oldest first, plus the end of the newest week.
// Computed here rather than with date_trunc('week', …) because Postgres weeks
// start on Monday and these buckets have always started on Sunday — the labels
// below are generated from the same array, so the chart and the SQL can't drift.
function weekBuckets(): Date[] {
  const bounds: Date[] = [];
  for (let i = 3; i >= -1; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    bounds.push(d);
  }
  return bounds; // 5 bounds = 4 buckets
}

export default async function AdminAnalyticsPage() {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const wk = weekBuckets();

  const [
    [{ total }],
    [{ menteeCount }],
    [{ mentorCount }],
    [{ clubLeadCount }],
    [{ openReports }],
    tagRows,
    weekRows,
    activeUsersResult,
    [{ retainedMentors: retained }],
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
    // Counted in Postgres, not here. Every one of these five used to pull its
    // whole result set across the wire so JavaScript could reduce it to a
    // handful of integers: every user's tags, every journal entry in 28 days,
    // every active author, every active mentor. The payload grew with the
    // platform, forever, to render the same fifteen numbers.
    //
    // Tag histogram: at most 8 rows back instead of the entire users table.
    db.execute(sql`
      select lower(t) as tag, count(*)::int as n
      from ${users}, unnest(${users.interestTags}) as t
      group by lower(t)
      -- Tie-break by name. Interest tags bunch heavily at the same count, so
      -- ordering on count alone leaves Postgres free to return a different
      -- eight every load — the chart would reshuffle on refresh with no data
      -- having changed.
      order by count(*) desc, lower(t) asc
      limit 8
    `),
    // Weekly journal counts: one row, four numbers, instead of every entry.
    db
      .select({
        w0: sql<number>`count(*) filter (where ${journalEntries.createdAt} >= ${wk[0]} and ${journalEntries.createdAt} < ${wk[1]})`,
        w1: sql<number>`count(*) filter (where ${journalEntries.createdAt} >= ${wk[1]} and ${journalEntries.createdAt} < ${wk[2]})`,
        w2: sql<number>`count(*) filter (where ${journalEntries.createdAt} >= ${wk[2]} and ${journalEntries.createdAt} < ${wk[3]})`,
        w3: sql<number>`count(*) filter (where ${journalEntries.createdAt} >= ${wk[3]} and ${journalEntries.createdAt} < ${wk[4]})`,
      })
      .from(journalEntries)
      .where(gte(journalEntries.createdAt, wk[0])),
    // Active users = distinct authors of journals/messages in last 30 days.
    // The UNION dedupes in Postgres — someone who both journalled and messaged
    // is one active user, which is why this can't be two countDistinct calls.
    db.execute(sql`
      select count(distinct user_id)::int as n from (
        select ${journalEntries.userId} as user_id from ${journalEntries}
          where ${journalEntries.createdAt} >= ${thirtyDaysAgo}
        union
        select ${messages.senderId} from ${messages}
          where ${messages.createdAt} >= ${thirtyDaysAgo}
      ) a
    `),
    // Mentor retention = mentors holding at least one active mentorship.
    db
      .select({ retainedMentors: countDistinct(mentorships.mentorId) })
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
  const activeUsers = Number(
    (activeUsersResult.rows[0] as { n?: number } | undefined)?.n ?? 0,
  );

  const retainedMentors = Number(retained ?? 0);
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

  // Interest tag counts — already grouped, sorted and capped by Postgres.
  const tagRowsTyped = tagRows.rows as { tag: string; n: number }[];
  const maxTagCount = Math.max(...tagRowsTyped.map((r) => Number(r.n)), 1);
  const interestTagData = tagRowsTyped.map((r) => ({
    tag: r.tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    count: Number(r.n),
    pct: Math.round((Number(r.n) / maxTagCount) * 100),
  }));

  // Weekly journal counts — the four numbers Postgres just returned, labelled
  // from the same bucket bounds the SQL filtered on.
  const w = weekRows[0];
  const weeklyJournals = [w?.w0, w?.w1, w?.w2, w?.w3].map((n, i) => ({
    week: wk[i].toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    count: Number(n ?? 0),
  }));
  const maxWeekCount = Math.max(...weeklyJournals.map((x) => x.count), 1);

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
