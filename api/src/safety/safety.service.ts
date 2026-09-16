import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { milestones, safetyReports } from '../db/schema.js';
import { dispatchToAdmins } from '../notifications/internal/dispatch.js';

const REPORT_TYPES = ['inappropriate', 'concern'] as const;
const MAX_REPORT_NOTES = 5_000;

@Injectable()
export class SafetyService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /**
   * File a safety report.
   *
   * reporterId is stored ON PURPOSE and must stay: a safeguarding team that
   * cannot identify the child who reported abuse cannot check on them, cannot
   * ask the one follow-up question that makes the report actionable, and cannot
   * tell a repeated report from a first one. Dropping it would look like a
   * privacy win and would in fact remove the whole follow-up path.
   *
   * What it does NOT license is telling the reporter otherwise. The form's copy
   * states plainly that the safeguarding team sees who sent the report and that
   * the reported person never does — anyone changing either side must change
   * the other, or the app is back to making a promise to a child that it
   * breaks. Reporter identity is exposed only inside the admin panel, never on
   * any product surface.
   *
   * ANY role may file one: a mentor or parent raising a concern about a young
   * person is exactly as valid as a mentee raising one, so there is no role
   * check beyond being signed in.
   */
  async submitReport(userId: string, data: { type: string; notes: string }) {
    const type = (REPORT_TYPES as readonly string[]).includes(data.type)
      ? data.type
      : 'concern';
    const notes =
      typeof data.notes === 'string'
        ? data.notes.trim().slice(0, MAX_REPORT_NOTES)
        : '';

    const [report] = await this.db
      .insert(safetyReports)
      .values({ reporterId: userId, type, notes })
      .returning({ id: safetyReports.id });

    // Tell the safeguarding team NOW, rather than whenever somebody next
    // happens to open the queue. A report from a child about their own safety
    // sitting unread because nobody knew it existed is the one outcome this
    // feature cannot have — and until this existed, that was the only outcome
    // available.
    //
    // The notification deliberately carries no detail: it says a report was
    // filed and links to the queue, where identity and content sit behind the
    // admin gate. A push preview appears on a lock screen.
    await dispatchToAdmins({
      key: 'SAFETY_REPORT_FILED',
      vars: { reportId: report.id },
      dedupe: report.id,
    });

    return { ok: true, id: report.id };
  }

  /** Completing the safety module. Silent and idempotent by design. */
  async awardSafetyMilestone(userId: string) {
    await this.db
      .insert(milestones)
      .values({ userId, type: 'safety_module' })
      .onConflictDoNothing();
    return { ok: true };
  }
}
