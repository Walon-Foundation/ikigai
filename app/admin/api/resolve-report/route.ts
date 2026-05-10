import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { safetyReports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { reportId } = await request.json();
  if (!reportId) {
    return Response.json({ error: "Missing reportId" }, { status: 400 });
  }

  await db
    .update(safetyReports)
    .set({ resolvedAt: new Date() })
    .where(eq(safetyReports.id, reportId));

  return Response.json({ success: true, resolvedAt: new Date().toISOString() });
}
