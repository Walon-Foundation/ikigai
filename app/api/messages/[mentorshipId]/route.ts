import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { mentorships, messages, users } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mentorshipId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorshipId } = await params;

  const [myUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!myUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [membership] = await db
    .select({
      id: mentorships.id,
      menteeId: mentorships.menteeId,
      mentorId: mentorships.mentorId,
    })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.id, mentorshipId),
        or(
          eq(mentorships.menteeId, myUser.id),
          eq(mentorships.mentorId, myUser.id),
        ),
      ),
    )
    .limit(1);
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // The peer is whichever side of the mentorship isn't the current user.
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

  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
      senderName: users.displayName,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.mentorshipId, mentorshipId))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({
    peer,
    messages: rows.map((m) => ({
      id: m.id,
      content: m.content,
      senderName: m.senderName ?? "User",
      timestamp: m.createdAt?.toISOString() ?? new Date().toISOString(),
      isMine: m.senderId === myUser?.id,
    })),
  });
}
