import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/db-user";
import { db } from "@/db/db";
import { users, mentorships, journalEntries, milestones } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const [activeMentorshipRows, latestEntryRows, milestoneRows] = await Promise.all([
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
    db.select({ id: milestones.id }).from(milestones).where(eq(milestones.userId, user.id)),
  ]);

  const mentorshipRow = activeMentorshipRows[0] ?? null;
  const entryRow = latestEntryRows[0] ?? null;

  let mentor: { displayName: string | null; bio: string | null; interestTags: string[] | null } | null =
    null;
  if (mentorshipRow?.mentorId) {
    const [m] = await db
      .select({ displayName: users.displayName, bio: users.bio, interestTags: users.interestTags })
      .from(users)
      .where(eq(users.id, mentorshipRow.mentorId))
      .limit(1);
    mentor = m ?? null;
  }

  return (
    <DashboardClient
      user={{
        displayName: user.displayName ?? "User",
        role: user.role,
        growthLevel: user.growthLevel ?? 1,
      }}
      activeMentorship={
        mentorshipRow
          ? {
              id: mentorshipRow.id,
              status: mentorshipRow.status,
              matchScore: mentorshipRow.matchScore,
              lastActivityAt: mentorshipRow.lastActivityAt?.toISOString() ?? null,
              mentor,
            }
          : null
      }
      latestEntry={
        entryRow
          ? {
              content: entryRow.content,
              createdAt: entryRow.createdAt?.toISOString() ?? new Date().toISOString(),
              visibility: entryRow.visibility ?? "private",
            }
          : null
      }
      milestoneCount={milestoneRows.length}
    />
  );
}
