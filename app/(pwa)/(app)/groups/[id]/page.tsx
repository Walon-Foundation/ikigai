import { and, asc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db/db";
import { groupMembers, groups, messages, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { GroupMessageForm, JoinGroupButton } from "../groups-client";

export default async function GroupThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getDbUser();
  if (!me) redirect("/sign-in");

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);
  if (!group) notFound();

  const [[membership], thread] = await Promise.all([
    db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, me.id)))
      .limit(1),
    db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        senderName: users.displayName,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.groupId, id))
      .orderBy(asc(messages.createdAt)),
  ]);

  const isMember = !!membership;

  return (
    <div className="mx-auto flex h-[calc(100vh-1px)] max-w-2xl flex-col px-4 py-6 lg:h-screen">
      <Link
        href="/groups"
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Groups
      </Link>

      <div className="mb-4">
        <h1 className="font-display text-xl font-black text-foreground">
          {group.name}
        </h1>
        {group.description && (
          <p className="text-sm text-muted-foreground">{group.description}</p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {thread.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet — start the conversation.
          </p>
        ) : (
          thread.map((m) => {
            const mine = m.senderId === me.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <span className="mb-0.5 text-[11px] text-muted-foreground">
                  {mine ? "You" : (m.senderName ?? "User")}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground border border-border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        {isMember ? (
          <GroupMessageForm groupId={id} />
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Join to take part in this discussion.
            </p>
            <JoinGroupButton groupId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
