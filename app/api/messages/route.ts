import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { messages, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorshipId, content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const [sender] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
