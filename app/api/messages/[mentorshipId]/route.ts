import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, gt, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { mentorships, messages, users } from "@/db/schema";

// The chat polls this endpoint continuously, so it is the hottest read in the
// app and every avoidable round-trip here is paid over and over.
//
// Two things keep it cheap:
//   - `?since=<ISO>` returns only messages newer than the client's newest one.
//     A poll on a quiet thread then costs one indexed range scan returning zero
//     rows, instead of re-sending the whole conversation every few seconds.
//   - The membership check and the message read run concurrently. The message
//     query re-states the membership predicate as a SQL join, so it is
//     self-authorizing: a non-member's join matches nothing and the query can
//     safely be in flight before the membership check has come back.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorshipId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorshipId } = await params;
  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  const isIncremental = since !== null && !Number.isNaN(since.getTime());

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
          isIncremental ? gt(messages.createdAt, since) : undefined,
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

  // A poll only needs the new messages. The peer's name and photo don't change
  // mid-conversation, so we resolve them once, on the initial load.
  if (isIncremental) {
    return NextResponse.json({ messages: items, incremental: true });
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

  return NextResponse.json({ peer, messages: items, incremental: false });
}
