import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";

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

  const { schoolId, action } = await request.json();
  if (!schoolId) {
    return Response.json({ error: "Missing schoolId" }, { status: 400 });
  }

  if (action === "approved") {
    await db
      .update(schools)
      .set({ verifiedAt: new Date() })
      .where(eq(schools.id, schoolId));
  }

  return Response.json({ success: true, action });
}
