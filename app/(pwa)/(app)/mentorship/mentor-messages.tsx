import { and, desc, eq, inArray } from "drizzle-orm";
import { Clock, MessageCircle, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorships, users } from "@/db/schema";

// Mentor variant of /mentorship ("Messages" in the mentor nav): the mentor's
// conversations with their mentees. Accepting/declining requests stays in
// /mentor-portal — this page is only for reaching an existing chat.
export async function MentorMessages({ mentorId }: { mentorId: string }) {
  const visible = await db
    .select({
      id: mentorships.id,
      status: mentorships.status,
      lastActivityAt: mentorships.lastActivityAt,
      menteeName: users.displayName,
      menteeTags: users.interestTags,
    })
    .from(mentorships)
    .innerJoin(users, eq(users.id, mentorships.menteeId))
    .where(
      and(
        eq(mentorships.mentorId, mentorId),
        inArray(mentorships.status, ["requested", "active"]),
      ),
    )
    .orderBy(desc(mentorships.lastActivityAt));

  return (
    <>
      <PageHeader title="Messages" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
            <MessagesSquare className="size-6 text-primary" />
            <p className="mt-3 font-semibold text-foreground">
              No conversations yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              When a mentee connects with you, your chat will appear here.
            </p>
            <Link
              href="/mentor-portal"
              className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
            >
              View mentee requests
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((c) => (
              <ConversationRow key={c.id} conversation={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

type Conversation = {
  id: string;
  status: string | null;
  lastActivityAt: Date | null;
  menteeName: string | null;
  menteeTags: string[] | null;
};

function ConversationRow({ conversation: c }: { conversation: Conversation }) {
  const isActive = c.status === "active";
  const initials =
    c.menteeName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "M";

  const inner = (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-lg font-bold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">
            {c.menteeName ?? "Mentee"}
          </p>
          <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
            {isActive ? "Active" : "Pending"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {(c.menteeTags ?? []).join(", ") || "No interests listed"}
        </p>
        {c.lastActivityAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last activity{" "}
            {c.lastActivityAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </p>
        )}
      </div>
      {isActive ? (
        <MessageCircle className="size-5 text-muted-foreground" />
      ) : (
        <Clock className="size-5 text-muted-foreground" />
      )}
    </div>
  );

  // A pending request has no chat yet; accept it in /mentor-portal first.
  return isActive ? (
    <Link href={`/mentorship/${c.id}`} className="block hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}
