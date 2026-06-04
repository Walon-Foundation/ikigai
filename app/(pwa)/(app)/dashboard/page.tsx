import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { journalEntries, mentorships, milestones, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  if (user.role === "mentee" || user.role === "club_lead" || !user.role) {
    const [activeMentorshipRows, latestEntryRows, milestoneRows] =
      await Promise.all([
        db
          .select({
            id: mentorships.id,
            status: mentorships.status,
            matchScore: mentorships.matchScore,
            lastActivityAt: mentorships.lastActivityAt,
            mentorId: mentorships.mentorId,
          })
          .from(mentorships)
          .where(eq(mentorships.menteeId, user.id))
          .limit(1),
        db
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.userId, user.id))
          .orderBy(desc(journalEntries.createdAt))
          .limit(1),
        db
          .select({ id: milestones.id })
          .from(milestones)
          .where(eq(milestones.userId, user.id)),
      ]);

    const mentorshipRow = activeMentorshipRows[0] ?? null;
    let mentor = null;
    if (mentorshipRow?.mentorId) {
      const [m] = await db
        .select({
          displayName: users.displayName,
          bio: users.bio,
          interestTags: users.interestTags,
        })
        .from(users)
        .where(eq(users.id, mentorshipRow.mentorId))
        .limit(1);
      mentor = m ?? null;
    }

    return (
      <DashboardClient
        userRole="mentee"
        user={{
          displayName: user.displayName ?? "User",
          growthLevel: user.growthLevel ?? 1,
        }}
        menteeData={{
          activeMentorship: mentorshipRow
            ? {
                id: mentorshipRow.id,
                status: mentorshipRow.status,
                matchScore: mentorshipRow.matchScore,
                lastActivityAt:
                  mentorshipRow.lastActivityAt?.toISOString() ?? null,
                mentor,
              }
            : null,
          latestEntry: latestEntryRows[0]
            ? {
                content: latestEntryRows[0].content,
                createdAt:
                  latestEntryRows[0].createdAt?.toISOString() ??
                  new Date().toISOString(),
                visibility: latestEntryRows[0].visibility ?? "private",
              }
            : null,
          milestoneCount: milestoneRows.length,
        }}
      />
    );
  }

  if (user.role === "mentor") {
    const activeMenteeships = await db
      .select({
        id: mentorships.id,
        status: mentorships.status,
        lastActivityAt: mentorships.lastActivityAt,
        menteeId: mentorships.menteeId,
      })
      .from(mentorships)
      .where(eq(mentorships.mentorId, user.id))
      .limit(10);

    return (
      <DashboardClient
        userRole="mentor"
        user={{
          displayName: user.displayName ?? "Mentor",
          growthLevel: 1,
        }}
        mentorData={{
          activeMenteeships: activeMenteeships.map((m) => ({
            id: m.id,
            status: m.status,
            lastActivityAt: m.lastActivityAt?.toISOString() ?? null,
            menteeId: m.menteeId,
          })),
          isVerified: !!user.verifiedAt,
        }}
      />
    );
  }

  // Parent
  const onboardingData =
    (user.onboardingData as Record<string, unknown> | null) ?? {};

  return (
    <DashboardClient
      userRole="parent"
      user={{
        displayName: user.displayName ?? "Parent",
        growthLevel: 1,
      }}
      parentData={{
        childEmail: (onboardingData.childEmail as string | null) ?? null,
        childLinked: !!(onboardingData.childLinked as boolean | null),
        inviteCode: (onboardingData.inviteCode as string | null) ?? null,
      }}
    />
  );
}
