import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { mentorId, action } = await request.json();
  if (!mentorId || !action) {
    return Response.json({ error: "Missing mentorId or action" }, { status: 400 });
  }

  if (action === "approved") {
    await db.update(users).set({ verifiedAt: new Date() }).where(eq(users.id, mentorId));
  } else {
    await db.update(users).set({ role: "mentee", verifiedAt: null }).where(eq(users.id, mentorId));
  }

  return Response.json({ success: true, action });
}
