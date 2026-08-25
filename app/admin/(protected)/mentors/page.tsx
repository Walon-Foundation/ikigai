import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export default async function AdminMentorsPage() {
  const [pending, verified, rejected] = await Promise.all([
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
      // Pending means undecided — not merely unverified. Same reasoning as the
      // school queue: a rejected applicant is decided, and leaving them here
      // puts them back in front of the next admin to be reviewed all over
      // again, with no sign a call was already made.
      .where(
        and(
          eq(users.role, "mentor"),
          isNull(users.verifiedAt),
          isNull(users.rejectedAt),
        ),
      ),
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        bio: users.bio,
        verifiedAt: users.verifiedAt,
      })
      .from(users)
      .where(and(eq(users.role, "mentor"), isNotNull(users.verifiedAt))),
    // Rejected applicants stay on this page. Rejection used to write `role`
    // back to "mentee", so the person disappeared from every mentor query at
    // once and no admin screen could bring them back — this section is what
    // makes the decision visible, auditable and reversible.
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        rejectedAt: users.rejectedAt,
        rejectionReason: users.rejectionReason,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "mentor"),
          isNull(users.verifiedAt),
          isNotNull(users.rejectedAt),
        ),
      ),
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
      <div className="mb-8">
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

      {/* Rejected. Each row still links to the verify screen: the decision is
          reviewable and can be overturned there, which is the whole point of
          recording it instead of overwriting the applicant's role. */}
      {rejected.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Rejected
          </h2>
          <div className="space-y-3">
            {rejected.map((mentor) => (
              <Link
                key={mentor.id}
                href={`/admin/mentors/${mentor.id}/verify`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-muted font-display font-bold text-muted-foreground">
                  {(mentor.displayName ?? "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {mentor.displayName ?? "Unknown"}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {mentor.rejectionReason ?? mentor.email ?? "—"}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      Rejected{" "}
                      {mentor.rejectedAt
                        ? new Date(mentor.rejectedAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    Rejected
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
