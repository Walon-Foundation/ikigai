import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { flagsConcern } from '../common/journal.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { mentorships, messages, users } from '../db/schema.js';
import { dispatch } from '../notifications/internal/dispatch.js';
import { emitToMentorship } from '../realtime/realtime.sink.js';

const MAX_MESSAGE_LENGTH = 2000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class MessagingService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  async send(userId: string, mentorshipId: string, content: string) {
    if (!content?.trim()) throw new BadRequestException('Empty message');
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException('Message too long');
    }

    const sender = await this.actor.get(userId);

    const [membership] = await this.db
      .select({
        id: mentorships.id,
        menteeId: mentorships.menteeId,
        mentorId: mentorships.mentorId,
      })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.id, mentorshipId),
          or(
            eq(mentorships.menteeId, sender.id),
            eq(mentorships.mentorId, sender.id),
          ),
        ),
      )
      .limit(1);
    if (!membership) throw new ForbiddenException('Forbidden');

    const trimmed = content.trim();
    const [msg] = await this.db
      .insert(messages)
      .values({
        mentorshipId,
        senderId: sender.id,
        content: trimmed,
        // Safeguarding heuristic (no AI) — recomputed server-side, never
        // trusted from the client. Flagged messages surface to admins.
        keywordFlag: flagsConcern(trimmed),
      })
      .returning();

    // Bump activity so the mentor's conversation list re-sorts on new messages.
    await this.db
      .update(mentorships)
      .set({ lastActivityAt: new Date() })
      .where(eq(mentorships.id, mentorshipId));

    const recipientId =
      membership.menteeId === sender.id
        ? membership.mentorId
        : membership.menteeId;
    if (recipientId) {
      await dispatch({
        key: 'MESSAGE_RECEIVED',
        to: recipientId,
        vars: {
          sender: sender.displayName ?? 'your match',
          preview: trimmed.slice(0, 140),
          mentorshipId,
        },
      });
    }

    const timestamp = msg.createdAt?.toISOString() ?? new Date().toISOString();

    // Push it into the thread room. `isMine` is deliberately absent from the
    // emitted payload: the room holds both parties, and whether a message is
    // yours depends on who is reading it. Each client compares senderId itself.
    //
    // The row is already committed, so this is pure latency — a client that
    // misses it recovers with GET /messages/:id?after=<cursor>, which is the
    // same path a reconnect uses.
    emitToMentorship(mentorshipId, 'message', {
      id: msg.id,
      mentorshipId,
      content: msg.content,
      senderId: sender.id,
      senderName: sender.displayName ?? 'User',
      timestamp,
    });

    // Same shape the thread read uses, so a client can swap its optimistic
    // bubble for the real one without a refetch.
    return {
      id: msg.id,
      content: msg.content,
      senderName: sender.displayName ?? 'You',
      timestamp,
      isMine: true,
    };
  }

  /**
   * The chat polls this continuously, so it is the hottest read in the app and
   * every avoidable round-trip is paid over and over.
   *
   * Two things keep it cheap:
   *   - `after` returns only messages newer than the one the caller holds, so a
   *     poll on a quiet thread is an indexed range scan returning zero rows
   *     rather than the whole conversation.
   *   - The membership check and the message read run concurrently. The message
   *     query re-states the membership predicate as a SQL join, so it is
   *     self-authorizing: a non-member's join matches nothing, and the query can
   *     safely be in flight before the membership check returns.
   *
   * The cursor is a message ID, not a timestamp, and the server owns it. That
   * is not incidental: created_at is a Postgres timestamp with microsecond
   * precision, but a JS Date holds only milliseconds. Round-tripping the cursor
   * through a client would floor it BELOW the very message it points at, so
   * `created_at > cursor` would match that message again on every poll —
   * re-sending the last message forever and defeating the whole optimisation.
   * Comparing by id keeps it inside SQL at full precision.
   */
  async thread(userId: string, mentorshipId: string, after?: string) {
    const me = await this.actor.get(userId);

    // An unrecognised cursor falls back to a full load rather than erroring —
    // the caller recovers with a complete thread instead of an empty one.
    const afterId = after && UUID_RE.test(after) ? after : null;
    const isIncremental = afterId !== null;

    const isMember = or(
      eq(mentorships.menteeId, me.id),
      eq(mentorships.mentorId, me.id),
    );

    const [membershipRows, rows] = await Promise.all([
      this.db
        .select({
          menteeId: mentorships.menteeId,
          mentorId: mentorships.mentorId,
        })
        .from(mentorships)
        .where(and(eq(mentorships.id, mentorshipId), isMember))
        .limit(1),
      this.db
        .select({
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          senderName: users.displayName,
        })
        .from(messages)
        // Authorization lives in this join: rows survive only if the mentorship
        // they belong to is one the caller is a party to.
        .innerJoin(
          mentorships,
          and(eq(messages.mentorshipId, mentorships.id), isMember),
        )
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            eq(messages.mentorshipId, mentorshipId),
            afterId
              ? gt(
                  messages.createdAt,
                  // Resolved inside SQL, so no precision is lost. An unknown id
                  // (a deleted message) coalesces to -infinity and returns the
                  // whole thread rather than nothing.
                  sql`coalesce((select created_at from messages where id = ${afterId}::uuid), '-infinity'::timestamp)`,
                )
              : undefined,
          ),
        )
        .orderBy(asc(messages.createdAt)),
    ]);

    const membership = membershipRows[0];
    if (!membership) throw new ForbiddenException('Forbidden');

    const items = rows.map((m) => ({
      id: m.id,
      content: m.content,
      senderName: m.senderName ?? 'User',
      timestamp: m.createdAt?.toISOString() ?? new Date().toISOString(),
      isMine: m.senderId === me.id,
    }));

    // Hand the caller back the cursor for next time. Rows are ordered by
    // created_at, so the last is newest. An empty batch leaves the cursor where
    // it was — the client never computes it, which is what keeps it exact.
    const cursor = items.at(-1)?.id ?? afterId;

    // A poll only needs the new messages. The peer's name and photo do not
    // change mid-conversation, so they are resolved once, on the initial load.
    if (isIncremental) return { messages: items, cursor };

    const iAmMentor = membership.mentorId === me.id;
    const peerId = iAmMentor ? membership.menteeId : membership.mentorId;
    let peer = {
      name: iAmMentor ? 'Mentee' : 'Mentor',
      avatarUrl: null as string | null,
      role: iAmMentor ? 'mentee' : 'mentor',
    };
    if (peerId) {
      const [peerUser] = await this.db
        .select({ displayName: users.displayName, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, peerId))
        .limit(1);
      if (peerUser) {
        peer = {
          name: peerUser.displayName ?? peer.name,
          avatarUrl: peerUser.avatarUrl ?? null,
          role: iAmMentor ? 'mentee' : 'mentor',
        };
      }
    }

    return { peer, messages: items, cursor };
  }
}
