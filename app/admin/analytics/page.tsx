import { MOCK_ADMIN_STATS } from "@/lib/mock-data";

const INTEREST_TAG_DATA = [
  { tag: "Technology", count: 187, pct: 72 },
  { tag: "Entrepreneurship", count: 145, pct: 56 },
  { tag: "Healthcare", count: 112, pct: 43 },
  { tag: "Education", count: 98, pct: 38 },
  { tag: "Environmental Science", count: 76, pct: 29 },
  { tag: "Engineering", count: 65, pct: 25 },
  { tag: "Arts & Culture", count: 54, pct: 21 },
];

const WEEKLY_JOURNALS = [
  { week: "Apr 14", count: 134 },
  { week: "Apr 21", count: 156 },
  { week: "Apr 28", count: 189 },
  { week: "May 5", count: 212 },
];

export default function AdminAnalyticsPage() {
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
          label="Mentees reaching Advocate"
          value="23%"
          sub="Within 3 months of joining"
          barPct={23}
          color="bg-primary"
        />
        <StatCard
          label="Avg. mentor response time"
          value="2.3 hrs"
          sub="Time to first reply"
          barPct={77}
          color="bg-primary-light"
        />
        <StatCard
          label="Safety report resolution"
          value={`${MOCK_ADMIN_STATS.avgResolutionHours} hrs`}
          sub="Average resolution time"
          barPct={85}
          color="bg-primary"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Journal Trend */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">
            Journal Entries / Week
          </h2>
          <p className="mb-6 text-xs text-muted-foreground">Trending upward ↑</p>
          <div className="flex items-end gap-4 h-32">
            {WEEKLY_JOURNALS.map((w) => {
              const maxCount = Math.max(...WEEKLY_JOURNALS.map((x) => x.count));
              const heightPct = (w.count / maxCount) * 100;
              return (
                <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                    <div
                      className="w-full rounded-t-md bg-primary transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{w.count}</p>
                    <p className="text-[10px] text-muted-foreground">{w.week}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            User Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: "Mentees", count: MOCK_ADMIN_STATS.mentees, pct: Math.round((MOCK_ADMIN_STATS.mentees / MOCK_ADMIN_STATS.totalUsers) * 100), color: "bg-primary" },
              { label: "Mentors", count: MOCK_ADMIN_STATS.mentors, pct: Math.round((MOCK_ADMIN_STATS.mentors / MOCK_ADMIN_STATS.totalUsers) * 100), color: "bg-primary-light" },
              { label: "Club Leads", count: MOCK_ADMIN_STATS.clubLeads, pct: Math.round((MOCK_ADMIN_STATS.clubLeads / MOCK_ADMIN_STATS.totalUsers) * 100), color: "bg-accent" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.count} ({item.pct}%)</span>
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

        {/* Top Interest Tags */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Top Interest Tags
          </h2>
          <div className="space-y-3">
            {INTEREST_TAG_DATA.map((item) => (
              <div key={item.tag}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.tag}</span>
                  <span className="text-muted-foreground">
                    {item.count} users ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
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
