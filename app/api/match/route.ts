import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { MOCK_MENTORS } from "@/lib/mock-data";

function calcMatchScore(userTags: string[], mentorTags: string[]): number {
  if (!userTags.length && !mentorTags.length) return 50;
  const a = new Set(userTags.map((t) => t.toLowerCase()));
  const b = new Set(mentorTags.map((t) => t.toLowerCase()));
  const intersection = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  const score = union === 0 ? 50 : Math.round((intersection / union) * 60 + 30);
  return Math.min(score, 99);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [me] = await db
    .select({ id: users.id, interestTags: users.interestTags })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  const myTags = me?.interestTags ?? [];

  const verifiedMentors = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      bio: users.bio,
      interestTags: users.interestTags,
    })
    .from(users)
    .where(eq(users.role, "mentor"))
    .then((rows) => rows.filter((r) => r.interestTags));

  if (verifiedMentors.length === 0) {
    // Fall back to mock data when no verified mentors exist in DB
    const scored = MOCK_MENTORS.map((m) => ({
      ...m,
      matchScore: calcMatchScore(myTags, m.interestTags),
    }));
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return NextResponse.json({ matches: scored.slice(0, 5) });
  }

  const scored = verifiedMentors.map((m) => ({
    ...m,
    matchScore: calcMatchScore(myTags, m.interestTags ?? []),
  }));
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ matches: scored.slice(0, 5) });
}
