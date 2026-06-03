"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { milestones, schools, users } from "@/db/schema";

export async function registerSchool(data: {
  name: string;
  region: "freetown" | "western_rural";
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");
  if (user.role !== "club_lead")
    throw new Error("Only club leads can register schools");

  const [school] = await db
    .insert(schools)
    .values({
      name: data.name.trim(),
      region: data.region,
      clubLeadId: user.id,
    })
    .returning({ id: schools.id });

  await db
    .update(users)
    .set({ schoolId: school.id })
    .where(eq(users.id, user.id));

  await db
    .insert(milestones)
    .values({ userId: user.id, type: "school_join" })
    .onConflictDoNothing();

  revalidatePath("/school");
}
