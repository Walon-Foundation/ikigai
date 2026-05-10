import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { schools } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { schoolId, action } = await request.json();
  if (!schoolId) {
    return Response.json({ error: "Missing schoolId" }, { status: 400 });
  }

  if (action === "approved") {
    await db.update(schools).set({ verifiedAt: new Date() }).where(eq(schools.id, schoolId));
  }

  return Response.json({ success: true, action });
}
