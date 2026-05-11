import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [caller] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (caller?.role !== "admin")
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const audienceCounts: Record<string, number> = {
    all: 523,
    mentees: 398,
    mentors: 87,
    club_leads: 38,
  };
  const sent = audienceCounts[body.audience ?? "all"] ?? 523;
  return Response.json({ success: true, sent });
}
