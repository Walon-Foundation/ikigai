import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { messages, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mentorshipId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorshipId } = await params;

  const [myUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

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

  return NextResponse.json(
    rows.map((m) => ({
      id: m.id,
      content: m.content,
      senderName: m.senderName ?? "User",
      timestamp: m.createdAt?.toISOString() ?? new Date().toISOString(),
      isMine: m.senderId === myUser?.id,
    }))
  );
}
