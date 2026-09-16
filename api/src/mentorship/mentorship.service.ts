import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { MENTOR_CAPACITY, matchScore } from '../common/match.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  meetingVerifications,
  mentorReviews,
  mentorships,
  milestones,
  users,
} from '../db/schema.js';
import { isVerificationMethod } from '../common/verification.js';
import { dispatch } from '../notifications/internal/dispatch.js';
import {
  baseEndDate,
  getStageReadiness,
  promoteMenteeStage,
} from './mentorship.helpers.js';

const MAX_COMMENT = 1_000;

export type AcceptResult = {
  ok: boolean;
  reason?: 'full' | 'not_found' | 'already_paired';
};

@Injectable()
export class MentorshipService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  /** Confirm the mentor owns this ACTIVE mentorship, and return its mentee. */
  private async mentorshipForMentor(mentorshipId: string, mentorId: string) {
    const [m] = await this.db
      .select({ id: mentorships.id, menteeId: mentorships.menteeId })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.id, mentorshipId),
          eq(mentorships.mentorId, mentorId),
          eq(mentorships.status, 'active'),
        ),
      )
      .limit(1);
    if (!m) throw new BadRequestException('Mentorship not found');
    return m;
  }

  /**
   * A mentee requests a mentor. Creates a 'requested' mentorship the mentor
   * must accept before chat or tasks unlock. The match score is computed from
   * interest-tag overlap at request time.
   */
  async requestMentor(userId: string, mentorId: string) {
    // Role AND approval, both enforced server-side: this endpoint is reachable
    // by anyone signed in regardless of the screen that called it.
    const me = await this.actor.requireApprovedMentee(userId);

    // One mentor at a time. Checked before the request is created, so a mentee
    // who is already paired is told plainly rather than accumulating requests
    // no mentor is allowed to accept.
    const [{ activeCount: myActive }] = await this.db
      .select({ activeCount: count() })
      .from(mentorships)
      .where(
        and(eq(mentorships.menteeId, me.id), eq(mentorships.status, 'active')),
      );
    if (Number(myActive) > 0) {
      throw new BadRequestException(
        'You already have a mentor. A mentee works with one mentor at a time — end your current mentorship before requesting another.',
      );
    }

    const [mentor] = await this.db
      .select({ id: users.id, interestTags: users.interestTags })
      .from(users)
      // Defence in depth: cannot request a mentor ikigai hasn't approved.
      .where(
        and(
          eq(users.id, mentorId),
          eq(users.role, 'mentor'),
          isNotNull(users.verifiedAt),
        ),
      )
      .limit(1);
    if (!mentor) throw new BadRequestException('Mentor not found');

    const [{ activeCount }] = await this.db
      .select({ activeCount: count() })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.mentorId, mentorId),
          eq(mentorships.status, 'active'),
        ),
      );
    if (Number(activeCount) >= MENTOR_CAPACITY) {
      throw new BadRequestException('This mentor is at full capacity');
    }

    const existing = await this.db
      .select({ id: mentorships.id })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, me.id),
          eq(mentorships.mentorId, mentorId),
        ),
      )
      .limit(1);
    if (existing.length > 0) return { mentorshipId: existing[0].id };

    const [row] = await this.db
      .insert(mentorships)
      .values({
        menteeId: me.id,
        mentorId,
        status: 'requested',
        matchScore: matchScore(me.interestTags, mentor.interestTags),
      })
      .returning({ id: mentorships.id });

    // Until this existed, a mentor learned they had been asked only by opening
    // the portal and noticing. A request nobody is told about is a request the
    // mentee watches go unanswered.
    await dispatch({
      key: 'MENTOR_REQUEST_RECEIVED',
      to: mentorId,
      vars: { mentee: me.displayName ?? 'A mentee' },
      dedupe: row.id,
    });

    return { mentorshipId: row.id };
  }

  /** Accept a pending request. Enforces the per-mentor active cap. */
  async acceptRequest(
    userId: string,
    mentorshipId: string,
  ): Promise<AcceptResult> {
    const me = await this.actor.requireApprovedMentor(userId);

    const [request] = await this.db
      .select({ id: mentorships.id, menteeId: mentorships.menteeId })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.id, mentorshipId),
          eq(mentorships.mentorId, me.id),
          eq(mentorships.status, 'requested'),
        ),
      )
      .limit(1);
    if (!request) return { ok: false, reason: 'not_found' };

    const [{ value: activeCount }] = await this.db
      .select({ value: count() })
      .from(mentorships)
      .where(
        and(eq(mentorships.mentorId, me.id), eq(mentorships.status, 'active')),
      );
    if (activeCount >= MENTOR_CAPACITY) return { ok: false, reason: 'full' };

    // One mentor at a time. A mentee may hold requests with several mentors —
    // that is how they shop for a match — but the first acceptance closes the
    // question, and a second mentor accepting later must be told why they
    // cannot, not silently create a second pairing.
    if (request.menteeId) {
      const [{ value: menteeActive }] = await this.db
        .select({ value: count() })
        .from(mentorships)
        .where(
          and(
            eq(mentorships.menteeId, request.menteeId),
            eq(mentorships.status, 'active'),
          ),
        );
      if (menteeActive > 0) return { ok: false, reason: 'already_paired' };
    }

    const startedAt = new Date();
    try {
      await this.db
        .update(mentorships)
        .set({
          status: 'active',
          startedAt,
          baseEndsAt: baseEndDate(startedAt),
          lastActivityAt: startedAt,
        })
        .where(eq(mentorships.id, mentorshipId));
    } catch (error) {
      // Most likely the partial unique index refusing it: another mentor
      // accepted this mentee between the check above and this write. The check
      // is not redundant — it answers clearly in the ordinary case — but only
      // the index can settle a genuine race.
      //
      // Confirmed by re-reading rather than assumed from the fact that
      // something threw. A dropped connection also lands here, and reporting
      // that as "already matched" would send the mentor away believing a false
      // thing about their mentee.
      const [{ value: nowActive }] = await this.db
        .select({ value: count() })
        .from(mentorships)
        .where(
          and(
            eq(mentorships.menteeId, request.menteeId ?? ''),
            eq(mentorships.status, 'active'),
          ),
        );
      if (nowActive > 0) return { ok: false, reason: 'already_paired' };
      throw error;
    }

    if (request.menteeId) {
      await this.db
        .insert(milestones)
        .values({ userId: request.menteeId, type: 'mentor_connect' })
        .onConflictDoNothing();

      await dispatch({
        key: 'MATCH_ACCEPTED',
        to: request.menteeId,
        vars: { mentor: me.displayName ?? 'Your mentor' },
      });
    }

    return { ok: true };
  }

  async declineRequest(userId: string, mentorshipId: string) {
    const me = await this.actor.requireApprovedMentor(userId);
    const [updated] = await this.db
      .update(mentorships)
      .set({ status: 'declined' })
      .where(
        and(
          eq(mentorships.id, mentorshipId),
          eq(mentorships.mentorId, me.id),
          eq(mentorships.status, 'requested'),
        ),
      )
      .returning({ menteeId: mentorships.menteeId });

    if (updated?.menteeId) {
      await dispatch({ key: 'MATCH_DECLINED', to: updated.menteeId });
    }
    return { ok: true };
  }

  /**
   * Promote a mentee to the next programme stage.
   *
   * Mentor-only, with no mentee equivalent anywhere — this is the "only the
   * mentor has the privilege to press complete" rule at the stage level. The
   * pacing floor is checked inside promoteMenteeStage and a mentor cannot waive
   * it, so the answer to "why can't I promote her yet" is always a sentence
   * about tasks and days rather than a disabled button.
   */
  async promoteMentee(userId: string, mentorshipId: string) {
    const me = await this.actor.requireApprovedMentor(userId);
    const m = await this.mentorshipForMentor(mentorshipId, me.id);
    if (!m.menteeId) return { ok: false, reason: 'Mentorship has no mentee.' };

    const result = await promoteMenteeStage({
      menteeId: m.menteeId,
      mentorId: me.id,
      mentorshipId: m.id,
    });
    if (!result.ok) return { ok: false, reason: result.reason };

    await dispatch({
      key: 'STAGE_ADVANCED',
      to: m.menteeId,
      vars: {
        stage: `${result.to.charAt(0).toUpperCase()}${result.to.slice(1)}`,
      },
      // One promotion to a given stage is one notification, however many times
      // the action is retried.
      dedupe: `${m.id}:${result.to}`,
    });

    return { ok: true, to: result.to };
  }

  /** Pacing status for the mentor's screen. Read-only. */
  async menteeStageStatus(userId: string, mentorshipId: string) {
    const me = await this.actor.requireApprovedMentor(userId);
    const m = await this.mentorshipForMentor(mentorshipId, me.id);
    if (!m.menteeId) return null;
    return getStageReadiness(m.menteeId);
  }

  /**
   * A mentee or parent leaves (or updates) a rating and testimonial.
   * One review per author per mentor, enforced by a unique index.
   */
  async submitReview(
    userId: string,
    input: { mentorId: string; rating: number; comment?: string | null },
  ) {
    const me = await this.actor.requireRole(userId, ['mentee', 'parent']);

    const rating = Math.max(
      1,
      Math.min(5, Math.round(Number(input.rating) || 0)),
    );
    const comment =
      typeof input.comment === 'string'
        ? input.comment.trim().slice(0, MAX_COMMENT) || null
        : null;

    // Confirm the target is actually a mentor — the same (role, verifiedAt)
    // pair the marketplace and the matcher select on. Checking only users.id
    // meant any signed-in user could attach a public star rating and free-text
    // comment to any user id at all, including another mentee's: a way to
    // publish text about a minor on a profile they do not control and cannot
    // moderate. Requiring verifiedAt keeps reviews to vetted accounts, so an
    // unapproved mentor cannot accumulate a rating before review.
    const [mentor] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, input.mentorId),
          eq(users.role, 'mentor'),
          isNotNull(users.verifiedAt),
        ),
      )
      .limit(1);
    if (!mentor) throw new BadRequestException('Mentor not found');

    await this.db
      .insert(mentorReviews)
      .values({
        mentorId: input.mentorId,
        authorId: me.id,
        rating,
        comment,
      })
      .onConflictDoUpdate({
        target: [mentorReviews.mentorId, mentorReviews.authorId],
        set: { rating, comment, createdAt: new Date() },
      });

    return { ok: true };
  }

  /**
   * Verify one of the three required in-person meetings.
   *
   * Either party can confirm. Meetings must be verified in order, and each
   * number only once (unique index). Meeting 3 graduates the mentee and records
   * the milestone that feeds the roadmap.
   */
  async verifyMeeting(
    userId: string,
    data: {
      mentorshipId: string;
      meetingNumber: number;
      method: string;
      lat?: string | null;
      lng?: string | null;
    },
  ) {
    const meetingNumber = Number(data.meetingNumber);
    if (![1, 2, 3].includes(meetingNumber)) {
      throw new BadRequestException('Invalid meeting number');
    }
    const method = isVerificationMethod(data.method) ? data.method : 'photo';

    // Caller must belong to this mentorship — either side.
    const [mentorship] = await this.db
      .select({
        id: mentorships.id,
        menteeId: mentorships.menteeId,
        mentorId: mentorships.mentorId,
      })
      .from(mentorships)
      .where(eq(mentorships.id, data.mentorshipId))
      .limit(1);
    if (!mentorship) throw new BadRequestException('Mentorship not found');
    if (mentorship.menteeId !== userId && mentorship.mentorId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    // Meetings happen in order.
    const done = await this.db
      .select({ meetingNumber: meetingVerifications.meetingNumber })
      .from(meetingVerifications)
      .where(eq(meetingVerifications.mentorshipId, data.mentorshipId));
    const doneNumbers = new Set(done.map((d) => d.meetingNumber));
    if (doneNumbers.has(meetingNumber)) return { ok: true }; // idempotent
    if (meetingNumber > 1 && !doneNumbers.has(meetingNumber - 1)) {
      throw new BadRequestException('Verify the previous meeting first');
    }

    await this.db
      .insert(meetingVerifications)
      .values({
        mentorshipId: data.mentorshipId,
        meetingNumber,
        method,
        lat: typeof data.lat === 'string' ? data.lat.slice(0, 32) : null,
        lng: typeof data.lng === 'string' ? data.lng.slice(0, 32) : null,
      })
      .onConflictDoNothing();

    // Graduation milestone for the mentee — feeds the roadmap and unlocks the
    // review prompt.
    if (meetingNumber === 3 && mentorship.menteeId) {
      await this.db
        .insert(milestones)
        .values({ userId: mentorship.menteeId, type: 'graduation' })
        .onConflictDoNothing();
      await this.db
        .update(mentorships)
        .set({ status: 'closed' })
        .where(eq(mentorships.id, data.mentorshipId));
    }

    return { ok: true };
  }
}
