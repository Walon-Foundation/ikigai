import { count, desc, eq, isNull } from "drizzle-orm";
import { MessagesSquare, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { groupMembers, groups } from "@/db/schema";
import { recommendClubs } from "@/lib/clubs";
import { getDbUser } from "@/lib/db-user";
import { CreateGroupForm } from "./groups-client";

export default async function GroupsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const isMentee = user.role === "mentee" || user.role === "club_lead";

  const [allGroups, myMemberships, memberCounts, recommended] =
    await Promise.all([
      // Hidden clubs drop out of the in-app list too. An admin hid it for a
      // reason, and "still browsable, just not on the website" is not what
      // taking something down means.
      db
        .select()
        .from(groups)
        .where(isNull(groups.hiddenAt))
        .orderBy(desc(groups.createdAt)),
      db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, user.id)),
      db
        .select({ groupId: groupMembers.groupId, members: count() })
        .from(groupMembers)
        .groupBy(groupMembers.groupId),
      // Recommendations are for mentees on a journey; a mentor or parent
      // browsing this page is not being matched to anything.
      isMentee ? recommendClubs(user.id) : Promise.resolve([]),
    ]);

  const myGroupIds = new Set(myMemberships.map((m) => m.groupId));
  const counts = new Map(
    memberCounts.map((c) => [c.groupId, Number(c.members)]),
  );

  return (
    <>
      <PageHeader title="Groups" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <CreateGroupForm />

        {recommended.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-1 flex items-center gap-1.5 font-display text-lg font-bold text-foreground">
              <Sparkles className="size-4 text-accent-ink" />
              Clubs for you
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Picked from your interests and where you are in your journey.
            </p>
            <div className="space-y-2">
              {recommended.map((club) => (
                <Link
                  key={club.id}
                  href={`/groups/${club.id}`}
                  className="block rounded-2xl border border-accent/30 bg-accent/5 p-4"
                >
                  <p className="font-semibold text-foreground">{club.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-earth-ink">
                    {club.reason}
                  </p>
                  {club.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {club.description}
                    </p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" /> {club.memberCount} members
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {allGroups.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
            <MessagesSquare className="size-6 text-primary" />
            <p className="mt-4 font-semibold text-foreground">No groups yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a group discussion above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allGroups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessagesSquare className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{g.name}</p>
                    {myGroupIds.has(g.id) && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Joined
                      </span>
                    )}
                  </div>
                  {g.description && (
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {g.description}
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" /> {counts.get(g.id) ?? 0} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
