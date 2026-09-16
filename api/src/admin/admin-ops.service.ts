import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import {
  bool,
  imageUrl,
  int,
  lines,
  moveInOrder,
  requiredText,
  slugify,
  text,
} from '../cms/cms-admin.helpers.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  enquiries,
  eventAttendance,
  events,
  groups,
  milestoneTemplates,
  skillCategories,
} from '../db/schema.js';
import { escapeHtml, sendableAddress } from '../mail/mail-templates.js';
import { pwaInstallUrl, sendMail } from '../mail/send-mail.js';
import { announceEvent } from '../notifications/internal/opportunities.js';
import { SKILL_STAGES, type SkillStage } from '../common/skill-stages.js';

const ENQUIRY_STATUSES = ['new', 'in_progress', 'handled', 'closed'];
const DECIDED: readonly string[] = ['handled', 'closed'];
const EMAILS_THE_ENQUIRER = 'handled';
const MAX_CLUB_REASON = 500;
const ATTENDANCE_STATUSES = ['registered', 'attended', 'no_show'];
const SKILL_DIMENSIONS = [
  'knowledge',
  'tools',
  'practice',
  'output',
  'feedback',
  'real_world',
  'impact',
];

@Injectable()
export class AdminOpsService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---- enquiries --------------------------------------------------------

  async setEnquiryStatus(adminId: string, id: string, status: string) {
    const next = ENQUIRY_STATUSES.includes(status) ? status : 'new';

    const [row] = await this.db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, id))
      .limit(1);

    const decided = DECIDED.includes(next);
    await this.db
      .update(enquiries)
      .set({
        status: next,
        // Stamp who decided it and when, so a finished enquiry is accountable.
        handledBy: decided ? adminId : null,
        handledAt: decided ? new Date() : null,
      })
      .where(eq(enquiries.id, id));

    // Email only on acceptance, and only on the TRANSITION into it — re-picking
    // the same status must not send a second round of congratulations.
    const recipient = sendableAddress(row?.email);
    if (
      next === EMAILS_THE_ENQUIRER &&
      row &&
      row.status !== EMAILS_THE_ENQUIRER &&
      recipient
    ) {
      const appUrl = pwaInstallUrl();
      const typeLabel =
        row.type === 'volunteer'
          ? 'volunteer application'
          : row.type === 'partner'
            ? 'partnership interest'
            : row.type === 'programme'
              ? 'programme request'
              : row.type === 'mentor'
                ? 'mentor application'
                : 'enquiry';
      const name = escapeHtml(row.name ?? 'there');
      await sendMail({
        to: recipient,
        subject: `Your Ikigai ${typeLabel} — accepted! 🎉`,
        html: `<p>Hi ${name},</p><p>Your ${typeLabel} has been <strong>accepted</strong> by the Ikigai team.</p><p>Open the app at <a href="${appUrl}">${appUrl}</a>.</p><p>— Ikigai</p>`,
        text: `Hi ${row.name ?? 'there'},\nYour ${typeLabel} has been accepted! App: ${appUrl}\n— Ikigai`,
      }).catch((e) => console.error('enquiry handled email failed', e));
    }

    return { ok: true, status: next };
  }

  // ---- clubs (moderation) -----------------------------------------------

  /**
   * Take a club off the public website, or put it back.
   *
   * Clubs publish automatically — that is the programme rule — so the only
   * moderation available is after the fact, and this is it. Hiding is NOT
   * deleting: the club keeps working inside the app for the mentees in it, and
   * only its public listing goes away. A club whose CONTENT is the problem is a
   * safeguarding matter, not a visibility one, and belongs in that queue.
   */
  async setClubVisibility(data: {
    clubId: string;
    hidden: boolean;
    reason?: string;
  }) {
    const reason =
      typeof data.reason === 'string'
        ? data.reason.trim().slice(0, MAX_CLUB_REASON)
        : '';
    if (data.hidden && !reason) {
      throw new BadRequestException('A reason is required to hide a club');
    }

    await this.db
      .update(groups)
      .set(
        data.hidden
          ? { hiddenAt: new Date(), hiddenReason: reason }
          : { hiddenAt: null, hiddenReason: null },
      )
      .where(eq(groups.id, data.clubId));

    return { ok: true, hidden: data.hidden };
  }

  async clearClubFlag(clubId: string) {
    await this.db
      .update(groups)
      .set({ keywordFlag: false })
      .where(eq(groups.id, clubId));
    return { ok: true };
  }

  // ---- skills taxonomy --------------------------------------------------

  async saveSkillCategory(id: string | null, v: Record<string, string>) {
    let name: string;
    try {
      name = requiredText(v.name, 120, 'Name');
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Invalid input',
      );
    }
    const fields = {
      name,
      description: text(v.description, 600),
      aliases: lines(v.aliases, 30, 60),
      isFallback: bool(v.isFallback),
      updatedAt: new Date(),
    };

    if (id) {
      await this.db
        .update(skillCategories)
        .set(fields)
        .where(eq(skillCategories.id, id));
      return { ok: true, id };
    }

    const rows = await this.db
      .select({ orderIndex: skillCategories.orderIndex })
      .from(skillCategories);
    const orderIndex = rows.reduce(
      (max, r) => Math.max(max, (r.orderIndex ?? 0) + 1),
      0,
    );
    const [row] = await this.db
      .insert(skillCategories)
      .values({ ...fields, slug: slugify(name), orderIndex })
      .returning({ id: skillCategories.id });
    return { ok: true, id: row?.id };
  }

  async removeSkillCategory(id: string) {
    await this.db.delete(skillCategories).where(eq(skillCategories.id, id));
    return { ok: true };
  }

  async moveSkillCategory(id: string, dir: 'up' | 'down') {
    const rows = await this.db
      .select({ id: skillCategories.id })
      .from(skillCategories)
      .orderBy(asc(skillCategories.orderIndex));
    await moveInOrder({
      rows,
      id,
      dir,
      apply: (rowId, orderIndex) =>
        this.db
          .update(skillCategories)
          .set({ orderIndex })
          .where(eq(skillCategories.id, rowId))
          .then(() => undefined),
    });
    return { ok: true };
  }

  async saveMilestoneTemplate(
    categoryId: string,
    id: string | null,
    v: Record<string, string>,
  ) {
    let label: string;
    try {
      label = requiredText(v.label, 300, 'Label');
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Invalid input',
      );
    }
    const stage = (SKILL_STAGES as readonly string[]).includes(v.stage ?? '')
      ? (v.stage as SkillStage)
      : 'discover';

    const fields = {
      label,
      stage,
      dimension: SKILL_DIMENSIONS.includes(v.dimension)
        ? v.dimension
        : 'practice',
      requiresMentorReview: bool(v.requiresMentorReview),
      growthPoints: int(v.growthPoints, 10, 0, 200),
      orderIndex: int(v.orderIndex, 0, 0, 999),
      updatedAt: new Date(),
    };

    if (id) {
      await this.db
        .update(milestoneTemplates)
        .set(fields)
        .where(eq(milestoneTemplates.id, id));
      return { ok: true, id };
    }

    const cat = text(categoryId, 100);
    if (!cat) throw new BadRequestException('Missing category');
    const [row] = await this.db
      .insert(milestoneTemplates)
      .values({ ...fields, categoryId: cat })
      .returning({ id: milestoneTemplates.id });
    return { ok: true, id: row?.id };
  }

  async removeMilestoneTemplate(id: string) {
    await this.db
      .delete(milestoneTemplates)
      .where(eq(milestoneTemplates.id, id));
    return { ok: true };
  }

  // ---- events -----------------------------------------------------------

  async saveEvent(
    adminId: string,
    id: string | null,
    v: Record<string, string>,
  ) {
    let title: string;
    try {
      title = requiredText(v.title, 200, 'Title');
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Invalid input',
      );
    }

    const parse = (s?: string) => {
      if (!s?.trim()) return null;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const startsAt = parse(v.startsAt);
    if (!startsAt) {
      throw new BadRequestException(
        'A valid start date and time is required',
      );
    }
    const endsAt = parse(v.endsAt);
    if (endsAt && endsAt < startsAt) {
      throw new BadRequestException('End date must be after start date');
    }

    const fields = {
      title,
      startsAt,
      endsAt,
      location: text(v.location, 200),
      imageUrl: imageUrl(v.imageUrl, 500),
      // allowVolunteer / allowJoin default to true (checked in the form).
      allowVolunteer: bool(v.allowVolunteer),
      allowJoin: bool(v.allowJoin),
      reportSummary: text(v.reportSummary, 4_000),
      reportPartners: text(v.reportPartners, 500),
      reportImpact: text(v.reportImpact, 500),
      interestTags: lines(v.interestTags, 12, 60),
      slug: slugify(title),
    };

    let eventId = id;
    if (id) {
      await this.db.update(events).set(fields).where(eq(events.id, id));
    } else {
      // Created from the CMS → public by default; that is why the admin is here.
      const [row] = await this.db
        .insert(events)
        .values({ ...fields, isPublic: true, createdBy: adminId })
        .returning({ id: events.id });
      eventId = row.id;
    }

    // Tell the mentees whose interests match. Deduped on the event, so editing
    // one afterwards — fixing a typo, adding the image — never re-announces it.
    if (eventId) await announceEvent(eventId);

    return { ok: true, id: eventId };
  }

  async removeEvent(id: string) {
    await this.db.delete(events).where(eq(events.id, id));
    return { ok: true };
  }

  async toggleEventPublish(id: string, next: boolean) {
    await this.db
      .update(events)
      .set({ isPublic: next === true })
      .where(eq(events.id, id));
    return { ok: true };
  }

  async setAttendanceStatus(
    eventId: string,
    userId: string,
    status: string,
  ) {
    if (!ATTENDANCE_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid attendance status');
    }
    await this.db
      .update(eventAttendance)
      .set({
        status,
        checkedInAt: status === 'attended' ? new Date() : null,
      })
      .where(
        // and(), NOT `&&`. JavaScript's && on two SQL condition objects
        // evaluates to the SECOND one, so `a && b` would silently filter on
        // userId alone — updating that person's attendance across every event
        // they have ever registered for.
        and(
          eq(eventAttendance.eventId, eventId),
          eq(eventAttendance.userId, userId),
        ),
      );
    return { ok: true };
  }
}
