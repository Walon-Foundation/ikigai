import { Inject, Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
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
} from '../db/schema.js';

/**
 * "Download your data" — everything this user has, as JSON.
 *
 * Deliberately EXCLUDES other people's material. A mentorship row is included
 * because they are in it, but the mentor's private notes about them are not,
 * and safety reports naming them are not: handing someone the report filed
 * against them would put the reporter at risk. That exclusion is a safeguarding
 * decision, not an oversight — do not "complete" this export by adding them.
 */
@Injectable()
export class DataExportService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async export(userId: string) {
    const [
      profile,
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
      this.db.select().from(users).where(eq(users.id, userId)).limit(1),
      this.db
        .select()
        .from(mentorships)
        .where(
          or(
            eq(mentorships.menteeId, userId),
            eq(mentorships.mentorId, userId),
          ),
        ),
      this.db.select().from(messages).where(eq(messages.senderId, userId)),
      this.db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId)),
      this.db.select().from(goals).where(eq(goals.userId, userId)),
      this.db.select().from(growthTrees).where(eq(growthTrees.userId, userId)),
      this.db.select().from(milestones).where(eq(milestones.userId, userId)),
      this.db
        .select()
        .from(guardianLinks)
        .where(
          or(
            eq(guardianLinks.parentId, userId),
            eq(guardianLinks.childId, userId),
          ),
        ),
      this.db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.userId, userId)),
      this.db
        .select()
        .from(eventAttendance)
        .where(eq(eventAttendance.userId, userId)),
      // payerId, matching the original export exactly. A payment where this
      // user is the MENTEE but someone else paid is that payer's financial
      // record, not theirs — and widening an export's scope inside a port is
      // not a change to make silently.
      this.db.select().from(payments).where(eq(payments.payerId, userId)),
    ]);

    const me = profile[0];
    return {
      exportedAt: new Date().toISOString(),
      profile: me
        ? {
            id: me.id,
            email: me.email,
            displayName: me.displayName,
            bio: me.bio,
            role: me.role,
            interestTags: me.interestTags,
            currentStage: me.currentStage,
            createdAt: me.createdAt,
          }
        : null,
      mentorships: myMentorships,
      messages: myMessages,
      journalEntries: myJournal,
      goals: myGoals,
      growthTree: myTree,
      milestones: myMilestones,
      guardianLinks: myGuardians,
      groups: myGroups,
      events: myEvents,
      payments: myPayments,
    };
  }
}
