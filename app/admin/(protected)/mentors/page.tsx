import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export default async function AdminMentorsPage() {
  const [pending, verified] = await Promise.all([
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        bio: users.bio,
        interestTags: users.interestTags,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, "mentor"), isNull(users.verifiedAt))),
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        bio: users.bio,
        verifiedAt: users.verifiedAt,
      })
      .from(users)
      .where(and(eq(users.role, "mentor"), isNotNull(users.verifiedAt))),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Mentor Verification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve mentor applications
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
            No pending mentor applications.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((mentor) => (
              <Link
                key={mentor.id}
                href={`/admin/mentors/${mentor.id}/verify`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {(mentor.displayName ?? "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {mentor.displayName ?? "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {mentor.bio ?? mentor.email ?? "—"}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      Submitted{" "}
                      {mentor.createdAt
                        ? new Date(mentor.createdAt).toLocaleDateString("en-GB")
                        : "—"}
                    </span>
                  </div>
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

      {/* Verified */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Verified Mentors
        </h2>
        {verified.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No verified mentors yet.
          </div>
        ) : (
          <div className="space-y-3">
            {verified.map((mentor) => (
              <div
                key={mentor.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {(mentor.displayName ?? "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {mentor.displayName ?? "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {mentor.bio ?? "—"}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Verified ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
