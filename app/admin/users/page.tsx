import Link from "next/link";
import { db } from "@/db/db";
import { users, schools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  club_lead: "Club Lead",
  admin: "Admin",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  verified: "bg-primary/10 text-primary",
  pending: "bg-accent/10 text-accent",
  suspended: "bg-destructive/10 text-destructive",
};

type RoleFilter = "all" | "mentee" | "mentor" | "club_lead" | "admin";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const filter = (role ?? "all") as RoleFilter;

  const where =
    filter !== "all"
      ? eq(users.role, filter as "mentee" | "mentor" | "club_lead" | "admin")
      : undefined;

  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      growthLevel: users.growthLevel,
      createdAt: users.createdAt,
      verifiedAt: users.verifiedAt,
      schoolName: schools.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(where)
    .orderBy(users.createdAt);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All registered platform users
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "mentee", "mentor", "club_lead"] as RoleFilter[]).map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/users" : `/admin/users?role=${f}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "All Users" : f.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  School
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Level
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((user, i) => {
                  const status = user.verifiedAt ? "verified" : "active";
                  const initials = (user.displayName ?? "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-border last:border-0",
                        i % 2 === 0 ? "" : "bg-muted/20"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                            {initials}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              {user.displayName ?? "—"}
                            </span>
                            {user.email && (
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {user.schoolName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.growthLevel ?? 1}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
                          )}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
