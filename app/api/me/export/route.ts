import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import {
  eventAttendance,
  goals,
  groupMembers,
  growthTrees,
  guardianLinks,
  journalEntries,
  mentorships,
  messages,
  milestones,
  payments,
  users,
} from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

/**
 * "Download your data" — everything this user has in the database, as JSON.
 *
 * Deliberately excludes other people's material: a mentorship row is included
 * because they're in it, but the mentor's private notes about them are not, and
 * safety reports naming them are not (handing someone the report filed against
 * them would put the reporter at risk).
 */
export async function GET() {
  const me = await getDbUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const [
    myMentorships,
    myMessages,
    myJournal,
    myGoals,
    myTree,
    myMilestones,
    myGuardians,
    myGroups,
    myEvents,
    myPayments,
  ] = await Promise.all([
    db
      .select()
      .from(mentorships)
      .where(
        or(eq(mentorships.menteeId, me.id), eq(mentorships.mentorId, me.id)),
      ),
    db.select().from(messages).where(eq(messages.senderId, me.id)),
    db.select().from(journalEntries).where(eq(journalEntries.userId, me.id)),
    db.select().from(goals).where(eq(goals.userId, me.id)),
    db.select().from(growthTrees).where(eq(growthTrees.userId, me.id)),
    db.select().from(milestones).where(eq(milestones.userId, me.id)),
    db
      .select()
      .from(guardianLinks)
      .where(
        or(eq(guardianLinks.parentId, me.id), eq(guardianLinks.childId, me.id)),
      ),
    db.select().from(groupMembers).where(eq(groupMembers.userId, me.id)),
    db.select().from(eventAttendance).where(eq(eventAttendance.userId, me.id)),
    db.select().from(payments).where(eq(payments.payerId, me.id)),
  ]);

  const [profile] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      interestTags: users.interestTags,
      growthLevel: users.growthLevel,
      verifiedAt: users.verifiedAt,
      journalDefaultVisibility: users.journalDefaultVisibility,
      onboardingData: users.onboardingData,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, me.id)))
    .limit(1);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    mentorships: myMentorships,
    messages: myMessages,
    journalEntries: myJournal,
    goals: myGoals,
    growthTree: myTree[0] ?? null,
    milestones: myMilestones,
    guardianLinks: myGuardians,
    groupMemberships: myGroups,
    eventAttendance: myEvents,
    payments: myPayments,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ikigai-my-data.json"`,
      // Never let a CDN or the service worker hold a copy of someone's export.
      "Cache-Control": "no-store, private",
    },
  });
}
