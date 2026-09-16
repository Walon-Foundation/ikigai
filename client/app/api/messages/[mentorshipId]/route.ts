import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, gt, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { mentorships, messages, users } from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The chat polls this endpoint continuously, so it is the hottest read in the
// app and every avoidable round-trip here is paid over and over.
//
// Two things keep it cheap:
//   - `?after=<messageId>` returns only messages newer than the one the client
//     already holds, so a poll on a quiet thread is an indexed range scan that
//     returns zero rows instead of re-sending the whole conversation.
//   - The membership check and the message read run concurrently. The message
//     query re-states the membership predicate as a SQL join, so it is
//     self-authorizing: a non-member's join matches nothing and the query can
//     safely be in flight before the membership check has come back.
//
// The cursor is a message *id*, not a timestamp, and the server owns it. That
// is not incidental: `created_at` is a Postgres timestamp with microsecond
// precision, but a JS Date only holds milliseconds. Round-tripping the cursor
// through the client would floor it *below* the very message it points at, so
// `created_at > cursor` would match that message again on every single poll —
// re-sending the last message forever and defeating the whole optimization.
// Comparing by id keeps the comparison inside SQL, at full precision.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorshipId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorshipId } = await params;
  const afterParam = request.nextUrl.searchParams.get("after");
  // An unrecognised cursor falls back to a full load rather than erroring — the
  // client recovers with a complete thread instead of an empty one.
  const afterId = afterParam && UUID_RE.test(afterParam) ? afterParam : null;
  const isIncremental = afterId !== null;

  const [myUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!myUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isMember = or(
    eq(mentorships.menteeId, myUser.id),
    eq(mentorships.mentorId, myUser.id),
  );

  const [membershipRows, rows] = await Promise.all([
    db
      .select({
        menteeId: mentorships.menteeId,
        mentorId: mentorships.mentorId,
      })
      .from(mentorships)
      .where(and(eq(mentorships.id, mentorshipId), isMember))
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
      // Authorization lives in this join: rows only survive if the mentorship
      // they belong to is one the caller is a party to.
      .innerJoin(
        mentorships,
        and(eq(messages.mentorshipId, mentorships.id), isMember),
      )
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.mentorshipId, mentorshipId),
          afterId
            ? gt(
                messages.createdAt,
                // Resolved inside SQL, so no precision is lost. If the id is
                // unknown (e.g. the message was deleted), coalescing to
                // -infinity returns the whole thread rather than nothing.
                sql`coalesce((select created_at from messages where id = ${afterId}::uuid), '-infinity'::timestamp)`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(messages.createdAt)),
  ]);

  const membership = membershipRows[0];
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = rows.map((m) => ({
    id: m.id,
    content: m.content,
    senderName: m.senderName ?? "User",
    timestamp: m.createdAt?.toISOString() ?? new Date().toISOString(),
    isMine: m.senderId === myUser.id,
  }));

  // Hand the client back the cursor to send next time. Rows are ordered by
  // created_at, so the last one is the newest. An empty batch leaves the cursor
  // where it was — the client never computes it, which is what keeps it exact.
  const cursor = items.at(-1)?.id ?? afterId;

  // A poll only needs the new messages. The peer's name and photo don't change
  // mid-conversation, so we resolve them once, on the initial load.
  if (isIncremental) {
    return NextResponse.json({ messages: items, cursor });
  }

  const iAmMentor = membership.mentorId === myUser.id;
  const peerId = iAmMentor ? membership.menteeId : membership.mentorId;
  let peer = {
    name: iAmMentor ? "Mentee" : "Mentor",
    avatarUrl: null as string | null,
    role: iAmMentor ? "mentee" : "mentor",
  };
  if (peerId) {
    const [peerUser] = await db
      .select({ displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, peerId))
      .limit(1);
    if (peerUser) {
      peer = {
        name: peerUser.displayName ?? peer.name,
        avatarUrl: peerUser.avatarUrl ?? null,
        role: iAmMentor ? "mentee" : "mentor",
      };
    }
  }

  return NextResponse.json({ peer, messages: items, cursor });
}
