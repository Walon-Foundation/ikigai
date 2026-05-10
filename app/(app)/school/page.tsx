import Link from "next/link";
import { Users, MapPin, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function SchoolPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  if (!user.schoolId) {
    return (
      <>
        <PageHeader title="School" />
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Not in a school yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You haven&apos;t been added to a school club. Ask your club lead to add you.
            </p>
          </div>
        </div>
      </>
    );
  }

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, user.schoolId))
    .limit(1);

  if (!school) redirect("/dashboard");

  const members = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      role: users.role,
      growthLevel: users.growthLevel,
    })
    .from(users)
    .where(eq(users.schoolId, user.schoolId));

  const isVerified = !!school.verifiedAt;

  return (
    <>
      <PageHeader title="School" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* School card */}
        <div className="mb-6 rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-primary-muted">Your School</p>
              <h2 className="font-display text-xl font-black">{school.name}</h2>
              {school.region && (
                <div className="mt-2 flex items-center gap-2 text-sm text-primary-muted">
                  <MapPin className="size-3.5" />
                  <span className="capitalize">{school.region.replace("_", " ")}</span>
                </div>
              )}
            </div>
            {isVerified ? (
              <div className="flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold">
                <CheckCircle className="size-3" />
                Verified
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                <Clock className="size-3" />
                Pending
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Users className="size-4 text-primary-muted" />
            <span className="text-sm text-primary-muted">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Pending notice */}
        {!isVerified && (
          <div className="mb-6 rounded-xl border border-accent/30 bg-accent-pale p-4">
            <p className="text-sm font-semibold text-foreground">
              Awaiting admin verification
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our team is reviewing your school registration. You&apos;ll be
              notified once approved.
            </p>
          </div>
        )}

        {/* Members */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Members ({members.length})
            </p>
          </div>
          {members.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No members yet.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary-muted/30 font-display text-xs font-bold text-primary">
                    {(member.displayName ?? "?").split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {member.displayName ?? "Unknown"}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {member.role.replace("_", " ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Level {member.growthLevel ?? 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 font-semibold text-foreground">Announcements</p>
          <div className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
            No announcements yet.
          </div>
        </div>
      </div>
    </>
  );
}
