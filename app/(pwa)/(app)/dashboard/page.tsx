import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
  growthTrees,
  guardianLinks,
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
    // Each Drizzle call over Neon's HTTP driver is its own network round-trip,
    // so the shape of this code is the page's latency. The mentorship and its
    // mentor used to be two sequential queries, and the open tasks a third,
    // chained behind them — three round-trips deep before the page could
    // render. Joining the mentor onto the mentorship collapses the first two,
    // and the tasks are fetched by subquery in the same batch as everything
    // else, leaving one parallel wave.
    const activeMentorship = db
      .select({
        id: mentorships.id,
        status: mentorships.status,
        matchScore: mentorships.matchScore,
        lastActivityAt: mentorships.lastActivityAt,
        mentorId: mentorships.mentorId,
        mentorName: users.displayName,
        mentorBio: users.bio,
        mentorTags: users.interestTags,
      })
      .from(mentorships)
      .leftJoin(users, eq(mentorships.mentorId, users.id))
      .where(eq(mentorships.menteeId, user.id))
      .orderBy(desc(mentorships.lastActivityAt))
      .limit(1);

    // Open tasks across all of this mentee's mentorships. We only display the
    // ones belonging to the mentorship selected above, but scoping the query by
    // mentee (rather than by a mentorship id we don't have yet) is what lets it
    // run in this wave instead of waiting on the query above. A mentee has a
    // handful of tasks, so filtering the surplus in memory is free — far
    // cheaper than the extra round-trip it replaces.
    const openTaskRows = db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        mentorshipId: tasks.mentorshipId,
      })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .where(
        and(eq(mentorships.menteeId, user.id), eq(tasks.status, "assigned")),
      )
      .orderBy(desc(tasks.createdAt));

    const [
      activeMentorshipRows,
      latestEntryRows,
      milestoneRows,
      treeRows,
      guardianRequests,
      allOpenTasks,
    ] = await Promise.all([
      activeMentorship,
      db
        .select({
          content: journalEntries.content,
          createdAt: journalEntries.createdAt,
          visibility: journalEntries.visibility,
        })
        .from(journalEntries)
        .where(eq(journalEntries.userId, user.id))
        .orderBy(desc(journalEntries.createdAt))
        .limit(1),
      db
        .select({ id: milestones.id })
        .from(milestones)
        .where(eq(milestones.userId, user.id)),
      db
        .select({ health: growthTrees.health, stage: growthTrees.stage })
        .from(growthTrees)
        .where(eq(growthTrees.userId, user.id))
        .limit(1),
      pendingRequestsForChild({ id: user.id, email: user.email }),
      openTaskRows,
    ]);

    const mentorshipRow = activeMentorshipRows[0] ?? null;
    const mentor = mentorshipRow?.mentorId
      ? {
          displayName: mentorshipRow.mentorName,
          bio: mentorshipRow.mentorBio,
          interestTags: mentorshipRow.mentorTags,
        }
      : null;

    // Same set the sequential version produced: open tasks for the mentorship
    // on display, and none at all when there isn't one.
    const openTasks = mentorshipRow
      ? allOpenTasks
          .filter((t) => t.mentorshipId === mentorshipRow.id)
          .map(({ id, title, description }) => ({ id, title, description }))
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

  // Parent. The child's tree used to be fetched only after the child had been
  // resolved. Joining it back through the accepted guardian link gets it in the
  // same wave — and the join keeps the consent gate intact, since the row only
  // exists when the link is accepted.
  const [link, child, childTreeRows] = await Promise.all([
    latestLinkForParent(user.id),
    acceptedChildForParent(user.id),
    db
      .select({ health: growthTrees.health, stage: growthTrees.stage })
      .from(growthTrees)
      .innerJoin(
        guardianLinks,
        and(
          eq(guardianLinks.childId, growthTrees.userId),
          eq(guardianLinks.parentId, user.id),
          eq(guardianLinks.status, "accepted"),
        ),
      )
      .limit(1),
  ]);

  const childTree = childTreeRows[0] ?? null;

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
