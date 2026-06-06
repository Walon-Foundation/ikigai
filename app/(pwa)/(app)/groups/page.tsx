import { count, desc, eq } from "drizzle-orm";
import { MessagesSquare, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { groupMembers, groups } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { CreateGroupForm } from "./groups-client";

export default async function GroupsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const [allGroups, myMemberships, memberCounts] = await Promise.all([
    db.select().from(groups).orderBy(desc(groups.createdAt)),
    db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, user.id)),
    db
      .select({ groupId: groupMembers.groupId, members: count() })
      .from(groupMembers)
      .groupBy(groupMembers.groupId),
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
