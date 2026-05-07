import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { journalEntries, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const entries: { content: string; visibility?: string; keywordFlag?: boolean }[] = body.entries ?? [];
  if (!entries.length) return NextResponse.json({ success: true, synced: 0 });

  await db.insert(journalEntries).values(
    entries.map((e) => ({
      userId: user.id,
      content: e.content,
      visibility: e.visibility ?? "private",
      keywordFlag: e.keywordFlag ?? false,
      syncedAt: new Date(),
    }))
  );

  return NextResponse.json({ success: true, synced: entries.length });
}
