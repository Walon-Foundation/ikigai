import { db } from "@/db/db";
import { users, mentorships, safetyReports, journalEntries } from "@/db/schema";
import { count, eq, isNull, isNotNull, and } from "drizzle-orm";

export default async function AdminAnalyticsPage() {
  const [
    [{ total }],
    [{ menteeCount }],
    [{ mentorCount }],
    [{ clubLeadCount }],
    [{ openReports }],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ menteeCount: count() }).from(users).where(eq(users.role, "mentee")),
    db.select({ mentorCount: count() }).from(users).where(eq(users.role, "mentor")),
    db.select({ clubLeadCount: count() }).from(users).where(eq(users.role, "club_lead")),
    db.select({ openReports: count() }).from(safetyReports).where(isNull(safetyReports.resolvedAt)),
  ]);

  const totalUsers = Number(total);
  const mentees = Number(menteeCount);
  const mentors = Number(mentorCount);
  const clubLeads = Number(clubLeadCount);

  const INTEREST_TAG_DATA = [
    { tag: "Technology", count: 0, pct: 0 },
    { tag: "Entrepreneurship", count: 0, pct: 0 },
    { tag: "Healthcare", count: 0, pct: 0 },
    { tag: "Education", count: 0, pct: 0 },
    { tag: "Environmental Science", count: 0, pct: 0 },
    { tag: "Engineering", count: 0, pct: 0 },
    { tag: "Arts & Culture", count: 0, pct: 0 },
  ];

  const WEEKLY_JOURNALS = [
    { week: "Apr 14", count: 0 },
    { week: "Apr 21", count: 0 },
    { week: "Apr 28", count: 0 },
    { week: "May 5", count: 0 },
  ];

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
              {
                label: "Mentees",
                count: mentees,
                pct: totalUsers > 0 ? Math.round((mentees / totalUsers) * 100) : 0,
                color: "bg-primary",
              },
              {
                label: "Mentors",
                count: mentors,
                pct: totalUsers > 0 ? Math.round((mentors / totalUsers) * 100) : 0,
                color: "bg-primary-light",
              },
              {
                label: "Club Leads",
                count: clubLeads,
                pct: totalUsers > 0 ? Math.round((clubLeads / totalUsers) * 100) : 0,
                color: "bg-accent",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.count} ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Journal Trend — placeholder until time-series data available */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">
            Journal Entries / Week
          </h2>
          <p className="mb-6 text-xs text-muted-foreground">
            Time-series data will appear as the platform grows.
          </p>
          <div className="flex items-end gap-4 h-32">
            {WEEKLY_JOURNALS.map((w) => (
              <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                  <div
                    className="w-full rounded-t-md bg-muted transition-all"
                    style={{ height: "10%" }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">{w.week}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Interest Tags */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Interest Tags
          </h2>
          <p className="text-sm text-muted-foreground">
            Tag analytics will populate as more users complete onboarding.
          </p>
          <div className="mt-4 space-y-3">
            {INTEREST_TAG_DATA.map((item) => (
              <div key={item.tag}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.tag}</span>
                  <span className="text-muted-foreground">—</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted" />
              </div>
            ))}
          </div>
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
