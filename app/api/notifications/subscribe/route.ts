import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await request.json();
  await db
    .update(users)
    .set({ pushSubscription: subscription })
    .where(eq(users.clerkId, userId));

  return NextResponse.json({ success: true });
}
