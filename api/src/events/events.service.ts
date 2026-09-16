import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { eventAttendance, events } from '../db/schema.js';
import { getMenteeProgress } from '../skills/progress.helpers.js';

@Injectable()
export class EventsService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  private async loadEvent(eventId: string) {
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /**
   * Register for an event.
   *
   * Enforces capacity, the roadmap-completion unlock gate (the Finding Yourself
   * Picnic unlocks at 50% for mentees), and the "only ongoing events" rule — a
   * past event must not be joinable even if someone posts the id directly.
   */
  async rsvp(userId: string, eventId: string) {
    const me = await this.actor.get(userId);
    const event = await this.loadEvent(eventId);

    const now = Date.now();
    const ends = event.endsAt?.getTime() ?? event.startsAt?.getTime() ?? 0;
    if (ends < now) {
      throw new BadRequestException(
        'This event has ended and is no longer open for registration',
      );
    }

    // The unlock gate applies to mentees; mentors are not on the roadmap.
    if (me.role === 'mentee' && (event.unlockAtPercent ?? 0) > 0) {
      const progress = await getMenteeProgress(me);
      if (progress.percent < (event.unlockAtPercent ?? 0)) {
        throw new BadRequestException(
          `Reach ${event.unlockAtPercent}% roadmap completion to unlock this event`,
        );
      }
    }

    // Already registered? Idempotent.
    const [existing] = await this.db
      .select({ id: eventAttendance.id })
      .from(eventAttendance)
      .where(
        and(
          eq(eventAttendance.eventId, eventId),
          eq(eventAttendance.userId, me.id),
        ),
      )
      .limit(1);
    if (existing) return { ok: true, alreadyRegistered: true };

    if (event.capacity != null) {
      const [{ taken }] = await this.db
        .select({ taken: count() })
        .from(eventAttendance)
        .where(eq(eventAttendance.eventId, eventId));
      if (Number(taken) >= event.capacity) {
        throw new BadRequestException('Event is full');
      }
    }

    await this.db
      .insert(eventAttendance)
      .values({
        eventId,
        userId: me.id,
        status: 'registered',
        rsvpAt: new Date(),
      })
      .onConflictDoNothing();

    return { ok: true, alreadyRegistered: false };
  }

  async cancelRsvp(userId: string, eventId: string) {
    await this.db
      .delete(eventAttendance)
      .where(
        and(
          eq(eventAttendance.eventId, eventId),
          eq(eventAttendance.userId, userId),
        ),
      );
    return { ok: true };
  }

  /**
   * Self check-in. Marks attendance, which feeds the roadmap's "attend an
   * activity" step — progress is derived from the attended count.
   */
  async checkIn(userId: string, eventId: string) {
    await this.loadEvent(eventId);
    await this.db
      .update(eventAttendance)
      .set({ status: 'attended', checkedInAt: new Date() })
      .where(
        and(
          eq(eventAttendance.eventId, eventId),
          eq(eventAttendance.userId, userId),
        ),
      );
    return { ok: true };
  }
}
