import Link from "next/link";
import { Clock, ChevronRight, CheckCircle } from "lucide-react";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";
import { eq, isNull, isNotNull, count } from "drizzle-orm";

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
      .where(isNull(schools.verifiedAt)),
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

  // Get member counts for active schools
  const memberCounts = await Promise.all(
    active.map(async (school) => {
      const [{ memberCount }] = await db
        .select({ memberCount: count() })
        .from(users)
        .where(eq(users.schoolId, school.id));
      return { schoolId: school.id, count: Number(memberCount) };
    })
  );
  const countMap = Object.fromEntries(memberCounts.map((m) => [m.schoolId, m.count]));

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
                    {school.clubLeadName ? ` · Submitted by ${school.clubLeadName}` : ""}
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
                    {school.region?.replace("_", " ") ?? "—"} · {countMap[school.id] ?? 0} members
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
