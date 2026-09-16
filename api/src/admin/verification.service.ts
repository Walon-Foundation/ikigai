import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { safetyReports, schools, users } from '../db/schema.js';
import { escapeHtml, sendableAddress } from '../mail/mail-templates.js';
import { pwaInstallUrl, sendMail } from '../mail/send-mail.js';
import { dispatch } from '../notifications/internal/dispatch.js';

/** Long enough for a real handover note, short enough not to be a document. */
const MAX_REASON_LENGTH = 2000;
const MAX_ADMIN_NOTES = 5000;

@Injectable()
export class VerificationService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /**
   * Approve or reject a mentor application.
   *
   * Rejection records a DECISION; it does not rewrite who the person is. It
   * used to set role back to "mentee", which erased the application itself:
   * both queries on the mentors queue filter role = 'mentor', so a rejected
   * applicant vanished from Pending and Verified at once, their verify page
   * 404'd, and nothing in the admin panel can put a role back — a misclick was
   * unrecoverable from inside the product. verifiedAt / rejectedAt /
   * rejectionReason keep the applicant visible, the decision reversible and the
   * reason recoverable by whoever follows up.
   */
  async verifyMentor(data: {
    mentorId: string;
    action: 'approved' | 'rejected';
    reason?: string;
  }) {
    if (data.action !== 'approved' && data.action !== 'rejected') {
      throw new BadRequestException('Invalid action');
    }
    const approved = data.action === 'approved';

    // Enforced here, not only in the UI: a rejection with no reason leaves the
    // applicant told "we need more information" and the team unable to say
    // what.
    const reason =
      typeof data.reason === 'string'
        ? data.reason.trim().slice(0, MAX_REASON_LENGTH)
        : '';
    if (!approved && !reason) {
      throw new BadRequestException('A rejection reason is required');
    }

    await this.db
      .update(users)
      .set(
        approved
          ? // Approving clears any earlier rejection — otherwise an overturned
            // decision shows as both verified and rejected.
            { verifiedAt: new Date(), rejectedAt: null, rejectionReason: null }
          : {
              verifiedAt: null,
              rejectedAt: new Date(),
              rejectionReason: reason,
            },
      )
      .where(eq(users.id, data.mentorId));

    const [mentor] = await this.db
      .select({ email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, data.mentorId))
      .limit(1);

    const appUrl = pwaInstallUrl();
    const recipient = sendableAddress(mentor?.email);
    const plainName = mentor?.displayName ?? 'there';
    // displayName is whatever the applicant typed into their own profile, so
    // it is user-controlled: unescaped, an applicant could put arbitrary markup
    // into a message Ikigai sends from its own DKIM-signed domain.
    const safeName = escapeHtml(plainName);

    if (approved && recipient) {
      await sendMail({
        to: recipient,
        subject: "You're approved as an Ikigai mentor 🎉",
        html: `
          <p>Hi ${safeName},</p>
          <p>Great news — your Ikigai mentor application has been <strong>approved</strong>!</p>
          <p>You can now receive mentee requests and start mentoring.</p>
          <p><a href="${appUrl}" style="display:inline-block;background:#1A5C3A;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">Open Ikigai</a></p>
          <p style="color:#5C5A55;font-size:14px">Install the PWA for the best experience: open <a href="${appUrl}">${appUrl}</a> on your phone and tap <em>Add to Home Screen</em>.</p>
          <p>— The Ikigai team</p>
        `,
        text: `Hi ${plainName},\n\nYour mentor application has been approved! Open Ikigai: ${appUrl}\n\n— Ikigai`,
      }).catch((e) => console.error('mentor approve email failed', e));
    } else if (!approved && recipient) {
      // The reason is an internal handover note and is deliberately NOT quoted
      // here: it is written for the colleague who picks this up, and a vetting
      // note about an adult who applied to work with children is not copy to
      // forward unreviewed. What the applicant gets is a promise that a person
      // will follow up — now backed by a recorded reason.
      await sendMail({
        to: recipient,
        subject: 'Ikigai mentor application update',
        html: `<p>Hi ${safeName},</p><p>We can't take your mentor application forward as it stands. Someone from the Ikigai team will follow up by email with the details and what can happen next — please check your inbox (and spam folder).</p><p>— Ikigai</p>`,
        text: `Hi ${plainName},\nWe can't take your mentor application forward as it stands. Someone from the Ikigai team will follow up by email.\n— Ikigai`,
      }).catch((e) => console.error('mentor reject email failed', e));
    }

    await dispatch({
      key: approved
        ? 'MENTOR_APPLICATION_APPROVED'
        : 'MENTOR_APPLICATION_REJECTED',
      to: data.mentorId,
    });

    return { ok: true, approved };
  }

  /**
   * Approve or reject a mentee application.
   *
   * Deliberately the same shape and the same three columns as verifyMentor:
   * they are not mentor-specific, and a second parallel set for mentees would
   * mean two definitions of "pending" drifting apart. Pending is undecided —
   * verified_at IS NULL AND rejected_at IS NULL — for both roles.
   *
   * What is NOT the same: no email goes out.
   */
  async verifyMentee(data: {
    menteeId: string;
    action: 'approved' | 'rejected';
    reason?: string;
  }) {
    if (data.action !== 'approved' && data.action !== 'rejected') {
      throw new BadRequestException('Invalid action');
    }

    // Confirm the target IS a mentee before writing a decision to it. These
    // columns also drive the mentor queue, so an unchecked id here would let
    // this endpoint approve or reject a mentor application from the wrong
    // screen entirely.
    const [target] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, data.menteeId))
      .limit(1);
    if (!target) throw new BadRequestException('Mentee not found');
    if (target.role !== 'mentee' && target.role !== 'club_lead') {
      throw new BadRequestException('Not a mentee application');
    }

    const approved = data.action === 'approved';
    const reason =
      typeof data.reason === 'string'
        ? data.reason.trim().slice(0, MAX_REASON_LENGTH)
        : '';
    if (!approved && !reason) {
      throw new BadRequestException('A rejection reason is required');
    }

    await this.db
      .update(users)
      .set(
        approved
          ? { verifiedAt: new Date(), rejectedAt: null, rejectionReason: null }
          : {
              verifiedAt: null,
              rejectedAt: new Date(),
              rejectionReason: reason,
            },
      )
      .where(eq(users.id, data.menteeId));

    await dispatch({
      key: approved ? 'MENTEE_APPROVED' : 'MENTEE_REJECTED',
      to: data.menteeId,
    });

    return { ok: true, approved };
  }

  async vetSchool(data: { schoolId: string; action: 'approved' | 'rejected' }) {
    if (data.action !== 'approved' && data.action !== 'rejected') {
      throw new BadRequestException('Invalid action');
    }
    const approved = data.action === 'approved';

    // Returning the row gives us the club lead to notify without a second
    // round-trip, and tells us whether the school existed at all.
    const [school] = await this.db
      .update(schools)
      .set(
        approved
          ? { verifiedAt: new Date(), rejectedAt: null }
          : { rejectedAt: new Date(), verifiedAt: null },
      )
      .where(eq(schools.id, data.schoolId))
      .returning({ id: schools.id, clubLeadId: schools.clubLeadId });

    if (!school) throw new BadRequestException('School not found');

    if (school.clubLeadId) {
      await dispatch({
        key: approved ? 'SCHOOL_APPROVED' : 'SCHOOL_REJECTED',
        to: school.clubLeadId,
      });
    }

    return { ok: true, approved };
  }

  async resolveReport(data: { reportId: string; adminNotes: string }) {
    const adminNotes =
      typeof data.adminNotes === 'string'
        ? data.adminNotes.trim().slice(0, MAX_ADMIN_NOTES)
        : '';

    await this.db
      .update(safetyReports)
      .set({ resolvedAt: new Date(), adminNotes: adminNotes || null })
      .where(eq(safetyReports.id, data.reportId));

    return { ok: true };
  }
}
