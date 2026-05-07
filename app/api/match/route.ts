import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq, ne } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [me] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, userId)).limit(1);

  const mentors = await db
    .select({ id: users.id, displayName: users.displayName, bio: users.bio, interestTags: users.interestTags })
    .from(users)
    .where(me ? eq(users.role, "mentor") : eq(users.role, "mentor"))
    .limit(10);

  return NextResponse.json({
    matches: mentors.map((m) => ({ ...m, matchScore: 85 })),
  });
}
