import { auth } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { mentorships, messages, users } from "@/db/schema";

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
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!sender)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [membership] = await db
    .select({ id: mentorships.id })
    .from(mentorships)
    .where(
      eq(mentorships.id, mentorshipId) &&
        or(
          eq(mentorships.menteeId, sender.id),
          eq(mentorships.mentorId, sender.id),
        ),
    )
    .limit(1);
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [msg] = await db
    .insert(messages)
    .values({ mentorshipId, senderId: sender.id, content: content.trim() })
    .returning();

  return NextResponse.json({
    id: msg.id,
    content: msg.content,
    timestamp: msg.createdAt?.toISOString(),
  });
}
