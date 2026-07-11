import { auth } from "@clerk/nextjs/server";
import { and, eq, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { mentorships, messages, users } from "@/db/schema";
import { flagsConcern } from "@/lib/journal";
import { notifyUser } from "@/lib/notify";

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorshipId, content } = await request.json();
  if (!content?.trim())
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const [sender] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!sender)
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
          eq(mentorships.menteeId, sender.id),
          eq(mentorships.mentorId, sender.id),
        ),
      ),
    )
    .limit(1);
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trimmed = content.trim();
  const [msg] = await db
    .insert(messages)
    .values({
      mentorshipId,
      senderId: sender.id,
      content: trimmed,
      // Safeguarding heuristic (no AI) — recomputed server-side, never trusted
      // from the client. Flagged messages surface to admins for review.
      keywordFlag: flagsConcern(trimmed),
    })
    .returning();

  // Bump activity so the mentor's conversation list re-sorts on new messages.
  await db
    .update(mentorships)
    .set({ lastActivityAt: new Date() })
    .where(eq(mentorships.id, mentorshipId));

  // Notify the other party (recipient = whichever side isn't the sender).
  const recipientId =
    membership.menteeId === sender.id
      ? membership.mentorId
      : membership.menteeId;
  if (recipientId) {
    await notifyUser({
      userId: recipientId,
      title: `New message from ${sender.displayName ?? "your match"}`,
      body: trimmed.slice(0, 140),
      type: "nudge",
      url: `/mentorship/${mentorshipId}`,
    });
  }

  return NextResponse.json({
    id: msg.id,
    content: msg.content,
    timestamp: msg.createdAt?.toISOString(),
  });
}
