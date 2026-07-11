import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { notifyUser } from "@/lib/notify";

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

  const { mentorId, action } = await request.json();
  if (!mentorId || !action) {
    return Response.json(
      { error: "Missing mentorId or action" },
      { status: 400 },
    );
  }

  if (action === "approved") {
    await db
      .update(users)
      .set({ verifiedAt: new Date() })
      .where(eq(users.id, mentorId));
    await notifyUser({
      userId: mentorId,
      title: "You're an approved mentor! ✅",
      body: "ikigai approved your mentor profile. You can now receive mentee requests.",
      type: "milestone",
      url: "/mentor-portal",
    });
  } else {
    await db
      .update(users)
      .set({ role: "mentee", verifiedAt: null })
      .where(eq(users.id, mentorId));
    await notifyUser({
      userId: mentorId,
      title: "Mentor application update",
      body: "Your mentor application needs more information. Please check your email from the ikigai team.",
      type: "milestone",
      url: "/dashboard",
    });
  }

  return Response.json({ success: true, action });
}
