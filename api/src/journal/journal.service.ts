import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import {
  flagsConcern,
  isJournalVisibility,
  MAX_JOURNAL_LENGTH,
} from '../common/journal.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  journalEntries,
  journalFeedback,
  mentorships,
  milestones,
} from '../db/schema.js';
import {
  dispatch,
  dispatchToAdmins,
} from '../notifications/internal/dispatch.js';

const MAX_COMMENT = 1_000;

@Injectable()
export class JournalService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  async saveEntry(
    userId: string,
    data: { content: string; visibility: string; expectedOwnerId?: string },
  ) {
    // The offline journal persists unsent entries in IndexedDB on a device this
    // audience frequently shares. Without this check the replay path resolved
    // the author from whoever happened to be signed in when it ran — so a
    // queued entry could be written into the next person's journal, carrying
    // its safeguarding flag onto the wrong child. The client already refuses to
    // replay another owner's entry; this is the same rule stated where it
    // cannot be bypassed.
    if (data.expectedOwnerId && data.expectedOwnerId !== userId) {
      throw new ForbiddenException('This entry belongs to a different account');
    }

    const content = typeof data.content === 'string' ? data.content.trim() : '';
    if (!content) throw new BadRequestException('Entry is empty');
    if (content.length > MAX_JOURNAL_LENGTH) {
      throw new BadRequestException('Entry too long');
    }

    const visibility = isJournalVisibility(data.visibility)
      ? data.visibility
      : 'private';

    // Recomputed here — never trust a client-supplied safety flag.
    const flagged = flagsConcern(content);

    const [entry] = await this.db
      .insert(journalEntries)
      .values({ userId, content, visibility, keywordFlag: flagged })
      .returning({ id: journalEntries.id });

    // A flagged entry used to set a boolean and wait to be noticed. The keyword
    // list exists to catch a child in trouble; catching them and telling nobody
    // is the same as not catching them.
    //
    // Nothing about the entry travels in the notification — not the author, not
    // a snippet. It says an entry was flagged and points at the queue, which is
    // behind an admin gate. A journal entry is private writing by a young
    // person, and a lock-screen preview is not a safeguarding review.
    if (flagged) {
      await dispatchToAdmins({ key: 'JOURNAL_FLAGGED', dedupe: entry.id });
    }

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    if (Number(total) === 1) {
      await this.db
        .insert(milestones)
        .values({ userId, type: 'first_journal' })
        .onConflictDoNothing();
    }

    return { success: true, id: entry.id, flagged };
  }

  /**
   * A mentor leaves feedback on a mentee's shared entry. Only for entries the
   * mentee actually shared, and only from a mentor with an active mentorship.
   */
  async addFeedback(
    userId: string,
    data: { entryId: string; menteeId: string; comment: string },
  ) {
    const me = await this.actor.requireApprovedMentor(userId);

    const comment =
      typeof data.comment === 'string'
        ? data.comment.trim().slice(0, MAX_COMMENT)
        : '';
    if (!comment) throw new BadRequestException('Empty comment');

    const [link] = await this.db
      .select({ id: mentorships.id })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.menteeId, data.menteeId),
          eq(mentorships.mentorId, me.id),
          eq(mentorships.status, 'active'),
        ),
      )
      .limit(1);
    if (!link) {
      throw new ForbiddenException('No active mentorship with this mentee');
    }

    const [entry] = await this.db
      .select({
        id: journalEntries.id,
        userId: journalEntries.userId,
        visibility: journalEntries.visibility,
      })
      .from(journalEntries)
      .where(eq(journalEntries.id, data.entryId))
      .limit(1);
    if (!entry || entry.userId !== data.menteeId) {
      throw new BadRequestException('Entry not found');
    }
    if (!['mentor_only', 'community'].includes(entry.visibility ?? 'private')) {
      throw new ForbiddenException('This entry is private');
    }

    await this.db
      .insert(journalFeedback)
      .values({ entryId: data.entryId, mentorId: me.id, comment });

    // The mentee shared an entry and their mentor answered it. Without this the
    // reply sits on a journal page they have no reason to reopen.
    await dispatch({
      key: 'JOURNAL_FEEDBACK',
      to: data.menteeId,
      vars: { mentor: me.displayName ?? 'Your mentor' },
    });

    return { ok: true };
  }

  /**
   * Shared entries plus their feedback, for the mentor's mentee page.
   *
   * mentorId comes from the SESSION, never from input. In the client this was
   * deliberately not a server action, because as one its only check was against
   * a value the caller passed in — which is no check, and returned any mentee's
   * shared entries to anyone who knew or guessed a (menteeId, mentorId) pair.
   * Here the guard establishes the mentor, so the join is a real authorization
   * boundary: a mentor without an active mentorship to this mentee matches no
   * rows.
   *
   * One left join, not two queries — over a network round-trip the trip is the
   * expensive part, not the row count. Left, not inner: an entry with no
   * feedback yet must still appear.
   */
  async sharedWithMentor(mentorId: string, menteeId: string) {
    const rows = await this.db
      .select({
        id: journalEntries.id,
        content: journalEntries.content,
        visibility: journalEntries.visibility,
        createdAt: journalEntries.createdAt,
        feedback: journalFeedback,
      })
      .from(journalEntries)
      .innerJoin(
        mentorships,
        and(
          eq(mentorships.menteeId, journalEntries.userId),
          eq(mentorships.mentorId, mentorId),
          eq(mentorships.status, 'active'),
        ),
      )
      .leftJoin(journalFeedback, eq(journalFeedback.entryId, journalEntries.id))
      .where(
        and(
          eq(journalEntries.userId, menteeId),
          inArray(journalEntries.visibility, ['mentor_only', 'community']),
        ),
      )
      .orderBy(journalEntries.createdAt);

    // The join repeats an entry once per feedback row; fold them back together,
    // preserving the order the query returned.
    const byEntry = new Map<string, SharedJournal>();
    for (const row of rows) {
      let entry = byEntry.get(row.id);
      if (!entry) {
        entry = {
          id: row.id,
          content: row.content,
          visibility: row.visibility,
          createdAt: row.createdAt?.toISOString() ?? null,
          feedback: [],
        };
        byEntry.set(row.id, entry);
      }
      if (row.feedback) entry.feedback.push(row.feedback);
    }

    return [...byEntry.values()];
  }
}

type SharedJournal = {
  id: string;
  content: string;
  visibility: string | null;
  createdAt: string | null;
  feedback: (typeof journalFeedback.$inferSelect)[];
};
