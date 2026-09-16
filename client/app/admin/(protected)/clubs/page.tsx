import { desc, eq } from "drizzle-orm";
import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { groups, users } from "@/db/schema";
import { ClubControls } from "./club-controls";

// Clubs moderation.
//
// There is no approval queue here on purpose: clubs publish the moment a mentee
// creates one, which is the programme rule. What this page provides is the
// counterweight — the flagged ones first, then everything else, each with a way
// to take it off the public site.
export default async function AdminClubsPage() {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      description: groups.description,
      interestTags: groups.interestTags,
      stage: groups.stage,
      keywordFlag: groups.keywordFlag,
      hiddenAt: groups.hiddenAt,
      hiddenReason: groups.hiddenReason,
      createdAt: groups.createdAt,
      creatorName: users.displayName,
    })
    .from(groups)
    .leftJoin(users, eq(groups.createdBy, users.id))
    .orderBy(desc(groups.keywordFlag), desc(groups.createdAt))
    .limit(200);

  const flagged = rows.filter((r) => r.keywordFlag);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Clubs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clubs go live on the public website as soon as a mentee creates one.
          Anything the safeguarding keyword list caught is listed first.
        </p>
      </div>

      {flagged.length > 0 && (
        <p className="mb-6 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {flagged.length} club{flagged.length === 1 ? "" : "s"} flagged for
          review.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No clubs yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((club) => (
            <div
              key={club.id}
              className={`rounded-2xl border bg-card p-5 ${
                club.keywordFlag ? "border-destructive/40" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    {club.name}
                    {club.keywordFlag && (
                      <AlertTriangle className="size-4 text-destructive" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {club.creatorName ?? "Unknown"}
                    {club.createdAt &&
                      ` · ${club.createdAt.toLocaleDateString("en-GB")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {club.stage && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">
                      {club.stage}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      club.hiddenAt
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {club.hiddenAt ? "Hidden" : "Live"}
                  </span>
                  {!club.hiddenAt && (
                    <Link
                      href={`/clubs/${club.slug}`}
                      className="flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      View <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              </div>

              {club.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {club.description}
                </p>
              )}

              {club.interestTags && club.interestTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {club.interestTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {club.hiddenReason && (
                <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Hidden because:{" "}
                  </span>
                  {club.hiddenReason}
                </p>
              )}

              <ClubControls
                clubId={club.id}
                clubName={club.name}
                hidden={!!club.hiddenAt}
                flagged={club.keywordFlag}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
