import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
  growthTrees,
  journalEntries,
  mentorships,
  milestones,
  tasks,
  users,
} from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import {
  acceptedChildForParent,
  latestLinkForParent,
  pendingRequestsForChild,
} from "@/lib/guardian";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  if (user.role === "mentee" || user.role === "club_lead" || !user.role) {
    const [
      activeMentorshipRows,
      latestEntryRows,
      milestoneRows,
      treeRows,
      guardianRequests,
    ] = await Promise.all([
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
        .orderBy(desc(mentorships.lastActivityAt))
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
      db
        .select()
        .from(growthTrees)
        .where(eq(growthTrees.userId, user.id))
        .limit(1),
      pendingRequestsForChild({ id: user.id, email: user.email }),
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

    // Outstanding tasks from an active mentorship.
    const openTasks = mentorshipRow
      ? await db
          .select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.mentorshipId, mentorshipRow.id),
              eq(tasks.status, "assigned"),
            ),
          )
          .orderBy(desc(tasks.createdAt))
      : [];

    const tree = treeRows[0] ?? null;

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
          tree: {
            health: tree?.health ?? 100,
            stage: tree?.stage ?? 1,
          },
          tasks: openTasks,
          guardianRequests,
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
        menteeName: users.displayName,
      })
      .from(mentorships)
      .innerJoin(users, eq(mentorships.menteeId, users.id))
      .where(eq(mentorships.mentorId, user.id))
      .limit(20);

    return (
      <DashboardClient
        userRole="mentor"
        user={{ displayName: user.displayName ?? "Mentor", growthLevel: 1 }}
        mentorData={{
          active: activeMenteeships
            .filter((m) => m.status === "active")
            .map((m) => ({
              id: m.id,
              menteeId: m.menteeId,
              menteeName: m.menteeName ?? "Mentee",
              lastActivityAt: m.lastActivityAt?.toISOString() ?? null,
            })),
          pendingCount: activeMenteeships.filter(
            (m) => m.status === "requested",
          ).length,
          isVerified: !!user.verifiedAt,
        }}
      />
    );
  }

  // Parent
  const [link, child] = await Promise.all([
    latestLinkForParent(user.id),
    acceptedChildForParent(user.id),
  ]);

  let childTree = null;
  if (child) {
    const [t] = await db
      .select({ health: growthTrees.health, stage: growthTrees.stage })
      .from(growthTrees)
      .where(eq(growthTrees.userId, child.id))
      .limit(1);
    childTree = t ?? null;
  }

  return (
    <DashboardClient
      userRole="parent"
      user={{ displayName: user.displayName ?? "Parent", growthLevel: 1 }}
      parentData={{
        childEmail: link?.childEmail ?? null,
        status: link?.status ?? null,
        inviteCode: link?.inviteCode ?? null,
        child: child
          ? {
              displayName: child.displayName ?? "Your child",
              health: childTree?.health ?? 100,
              stage: childTree?.stage ?? 1,
            }
          : null,
      }}
    />
  );
}
