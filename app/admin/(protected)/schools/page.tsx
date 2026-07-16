import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";

export default async function AdminSchoolsPage() {
  const [pending, active] = await Promise.all([
    db
      .select({
        id: schools.id,
        name: schools.name,
        region: schools.region,
        clubLeadName: users.displayName,
        createdAt: schools.verifiedAt, // schools have no createdAt — use id for ordering
      })
      .from(schools)
      .leftJoin(users, eq(schools.clubLeadId, users.id))
      // Pending means undecided — not merely unverified. A rejected school is
      // decided, and before `rejected_at` existed there was nowhere to say so,
      // so rejections sat here forever waiting to be re-reviewed.
      .where(and(isNull(schools.verifiedAt), isNull(schools.rejectedAt))),
    db
      .select({
        id: schools.id,
        name: schools.name,
        region: schools.region,
        verifiedAt: schools.verifiedAt,
      })
      .from(schools)
      .where(isNotNull(schools.verifiedAt)),
  ]);

  // Get member counts for active schools in one aggregate query instead of
  // one round-trip per school.
  const memberCounts = await db
    .select({ schoolId: users.schoolId, memberCount: count() })
    .from(users)
    .where(isNotNull(users.schoolId))
    .groupBy(users.schoolId);
  const countMap: Record<string, number> = {};
  for (const m of memberCounts) {
    if (m.schoolId) countMap[m.schoolId] = Number(m.memberCount);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          School Vetting
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve school club registrations
        </p>
      </div>

      {/* Pending */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">
            Pending Review
          </h2>
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            {pending.length}
          </span>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No pending school registrations.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((school) => (
              <Link
                key={school.id}
                href={`/admin/schools/${school.id}/vet`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-2xl">
                  🏫
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{school.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {school.region?.replace("_", " ") ?? "—"}
                    {school.clubLeadName
                      ? ` · Submitted by ${school.clubLeadName}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    Pending
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Active */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Active School Clubs
        </h2>
        {active.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No active schools yet.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((school) => (
              <div
                key={school.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="text-2xl">🏫</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{school.name}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {school.region?.replace("_", " ") ?? "—"} ·{" "}
                    {countMap[school.id] ?? 0} members
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <CheckCircle className="size-3" />
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
