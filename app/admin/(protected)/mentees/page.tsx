import { and, desc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { Clock } from "lucide-react";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { MenteeDecision } from "./mentee-decision";

// The mentee approval queue — the counterpart to /admin/mentors.
//
// Reads the same three decision columns the mentor queue reads, so "pending"
// means the same thing on both screens: undecided, not merely unverified. A
// rejected applicant stays here rather than disappearing, for the same reason
// they stay on the mentors page — the decision has to be visible to be
// reviewable, and a misclick has to be recoverable from inside the product.

// `club_lead` is a legacy role the rest of the app already groups with mentee
// (see AppLayout and requireRole), so it is grouped here too rather than
// leaving those accounts in a queue nobody looks at.
const MENTEE_ROLES = or(eq(users.role, "mentee"), eq(users.role, "club_lead"));

const PROFILE = {
  id: users.id,
  displayName: users.displayName,
  email: users.email,
  bio: users.bio,
  interestTags: users.interestTags,
  currentStage: users.currentStage,
  createdAt: users.createdAt,
  verifiedAt: users.verifiedAt,
  rejectedAt: users.rejectedAt,
  rejectionReason: users.rejectionReason,
};

export default async function AdminMenteesPage() {
  const [pending, approved, rejected] = await Promise.all([
    db
      .select(PROFILE)
      .from(users)
      .where(
        and(MENTEE_ROLES, isNull(users.verifiedAt), isNull(users.rejectedAt)),
      )
      .orderBy(desc(users.createdAt)),
    db
      .select(PROFILE)
      .from(users)
      .where(and(MENTEE_ROLES, isNotNull(users.verifiedAt)))
      .orderBy(desc(users.verifiedAt))
      .limit(50),
    db
      .select(PROFILE)
      .from(users)
      .where(
        and(
          MENTEE_ROLES,
          isNull(users.verifiedAt),
          isNotNull(users.rejectedAt),
        ),
      )
      .orderBy(desc(users.rejectedAt)),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Mentee Applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and onboard mentees. An approved mentee can request a mentor;
          until then they can explore the app but cannot be matched.
        </p>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">
            Pending Review
          </h2>
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            {pending.length}
          </span>
        </div>
        {pending.length === 0 ? (
          <EmptyRow>No applications waiting.</EmptyRow>
        ) : (
          <div className="space-y-3">
            {pending.map((mentee) => (
              <MenteeCard key={mentee.id} mentee={mentee}>
                <MenteeDecision
                  menteeId={mentee.id}
                  menteeName={mentee.displayName ?? "This mentee"}
                />
              </MenteeCard>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Rejected
          <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
            {rejected.length}
          </span>
        </h2>
        {rejected.length === 0 ? (
          <EmptyRow>Nothing here.</EmptyRow>
        ) : (
          <div className="space-y-3">
            {rejected.map((mentee) => (
              <MenteeCard key={mentee.id} mentee={mentee}>
                {mentee.rejectionReason && (
                  <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Internal note:{" "}
                    </span>
                    {mentee.rejectionReason}
                  </p>
                )}
                <MenteeDecision
                  menteeId={mentee.id}
                  menteeName={mentee.displayName ?? "This mentee"}
                  alreadyRejected
                />
              </MenteeCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Approved
          <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {approved.length}
          </span>
        </h2>
        {approved.length === 0 ? (
          <EmptyRow>No approved mentees yet.</EmptyRow>
        ) : (
          <div className="space-y-3">
            {approved.map((mentee) => (
              <MenteeCard key={mentee.id} mentee={mentee} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

type MenteeRow = {
  id: string;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  interestTags: string[] | null;
  currentStage: string;
  createdAt: Date | null;
};

function MenteeCard({
  mentee,
  children,
}: {
  mentee: MenteeRow;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {mentee.displayName ?? "Unnamed"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {mentee.email ?? "No email on file"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">
            {mentee.currentStage}
          </span>
          {mentee.createdAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {mentee.createdAt.toLocaleDateString("en-GB")}
            </span>
          )}
        </div>
      </div>

      {mentee.bio && (
        <p className="mt-2 text-sm text-muted-foreground">{mentee.bio}</p>
      )}

      {mentee.interestTags && mentee.interestTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {mentee.interestTags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
