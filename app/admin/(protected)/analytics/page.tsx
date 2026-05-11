import { count, eq, gte, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import { journalEntries, safetyReports, users } from "@/db/schema";

export default async function AdminAnalyticsPage() {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const [
    [{ total }],
    [{ menteeCount }],
    [{ mentorCount }],
    [{ clubLeadCount }],
    [{ openReports }],
    userTagRows,
    recentEntries,
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
  ]);

  const totalUsers = Number(total);
  const mentees = Number(menteeCount);
  const mentors = Number(mentorCount);
  const clubLeads = Number(clubLeadCount);

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

      {/* KPI Cards */}
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
