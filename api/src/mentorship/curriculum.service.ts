import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import type { DbUser } from '../common/types.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { curriculumItems, mentorships } from '../db/schema.js';
import { dispatch } from '../notifications/internal/dispatch.js';

const MAX_TITLE = 200;
const MAX_DESC = 2_000;

@Injectable()
export class CurriculumService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  /**
   * The curriculum is the mentor's, so writing to it needs an APPROVED mentor.
   * Checked separately from the isMentor test below, because that one only asks
   * which side of the mentorship the caller is on — and a mentor whose approval
   * was withdrawn is still on the mentor side of it.
   *
   * Not applied to the mentee branches: a mentee's own access does not depend
   * on their mentor's standing.
   */
  private requireApproved(me: DbUser) {
    if (!me.verifiedAt) throw new ForbiddenException('Not approved');
  }

  /** A mentorship the caller belongs to, and which side they are on. */
  private async mentorshipContext(mentorshipId: string, me: DbUser) {
    const [m] = await this.db
      .select({
        id: mentorships.id,
        mentorId: mentorships.mentorId,
        menteeId: mentorships.menteeId,
      })
      .from(mentorships)
      .where(eq(mentorships.id, mentorshipId))
      .limit(1);
    if (!m) throw new BadRequestException('Mentorship not found');
    const isMentor = m.mentorId === me.id;
    const isMentee = m.menteeId === me.id;
    if (!isMentor && !isMentee) throw new ForbiddenException('Forbidden');
    return { ...m, isMentor, isMentee };
  }

  /** Same, resolved from a curriculum item id. */
  private async itemContext(itemId: string, me: DbUser) {
    const [row] = await this.db
      .select({
        id: curriculumItems.id,
        status: curriculumItems.status,
        mentorshipId: curriculumItems.mentorshipId,
        mentorId: mentorships.mentorId,
        menteeId: mentorships.menteeId,
      })
      .from(curriculumItems)
      .innerJoin(mentorships, eq(curriculumItems.mentorshipId, mentorships.id))
      .where(eq(curriculumItems.id, itemId))
      .limit(1);
    if (!row) throw new BadRequestException('Item not found');
    const isMentor = row.mentorId === me.id;
    const isMentee = row.menteeId === me.id;
    if (!isMentor && !isMentee) throw new ForbiddenException('Forbidden');
    return { ...row, isMentor, isMentee };
  }

  private clampTitle(value: unknown): string {
    const t = typeof value === 'string' ? value.trim().slice(0, MAX_TITLE) : '';
    if (!t) throw new BadRequestException('Title is required');
    return t;
  }

  private clampDesc(value: unknown): string | null {
    const d = typeof value === 'string' ? value.trim().slice(0, MAX_DESC) : '';
    return d || null;
  }

  /** Mentor-only: append a new curriculum module. */
  async add(
    userId: string,
    input: {
      mentorshipId: string;
      title: string;
      description?: string;
      targetDate?: string | null;
    },
  ) {
    const me = await this.actor.get(userId);
    const ctx = await this.mentorshipContext(input.mentorshipId, me);
    if (!ctx.isMentor) {
      throw new ForbiddenException('Only the mentor can edit the curriculum');
    }
    this.requireApproved(me);

    const existing = await this.db
      .select({ orderIndex: curriculumItems.orderIndex })
      .from(curriculumItems)
      .where(eq(curriculumItems.mentorshipId, ctx.id))
      .orderBy(asc(curriculumItems.orderIndex));
    const nextIndex =
      existing.length > 0
        ? Math.max(...existing.map((e) => e.orderIndex)) + 1
        : 0;

    const title = this.clampTitle(input.title);
    await this.db.insert(curriculumItems).values({
      mentorshipId: ctx.id,
      title,
      description: this.clampDesc(input.description),
      orderIndex: nextIndex,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    });

    if (ctx.menteeId) {
      await dispatch({
        key: 'CURRICULUM_ITEM_ADDED',
        to: ctx.menteeId,
        vars: { title },
      });
    }
    return { ok: true };
  }

  /** Mentor-only: edit a module's title and description. */
  async edit(
    userId: string,
    input: { id: string; title: string; description?: string },
  ) {
    const me = await this.actor.get(userId);
    const ctx = await this.itemContext(input.id, me);
    if (!ctx.isMentor) {
      throw new ForbiddenException('Only the mentor can edit the curriculum');
    }
    this.requireApproved(me);

    await this.db
      .update(curriculumItems)
      .set({
        title: this.clampTitle(input.title),
        description: this.clampDesc(input.description),
      })
      .where(eq(curriculumItems.id, input.id));
    return { ok: true };
  }

  /** Mentor-only: remove a module. */
  async remove(userId: string, id: string) {
    const me = await this.actor.get(userId);
    const ctx = await this.itemContext(id, me);
    if (!ctx.isMentor) {
      throw new ForbiddenException('Only the mentor can edit the curriculum');
    }
    this.requireApproved(me);

    await this.db.delete(curriculumItems).where(eq(curriculumItems.id, id));
    return { ok: true };
  }

  /** Mentor-only: swap order with the neighbouring module. */
  async move(userId: string, id: string, direction: 'up' | 'down') {
    const me = await this.actor.get(userId);
    const ctx = await this.itemContext(id, me);
    if (!ctx.isMentor) {
      throw new ForbiddenException('Only the mentor can edit the curriculum');
    }
    this.requireApproved(me);

    const items = await this.db
      .select({
        id: curriculumItems.id,
        orderIndex: curriculumItems.orderIndex,
      })
      .from(curriculumItems)
      .where(eq(curriculumItems.mentorshipId, ctx.mentorshipId))
      .orderBy(asc(curriculumItems.orderIndex));

    const idx = items.findIndex((i) => i.id === id);
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapWith < 0 || swapWith >= items.length) {
      return { ok: true };
    }

    const a = items[idx];
    const b = items[swapWith];
    await this.db
      .update(curriculumItems)
      .set({ orderIndex: b.orderIndex })
      .where(eq(curriculumItems.id, a.id));
    await this.db
      .update(curriculumItems)
      .set({ orderIndex: a.orderIndex })
      .where(eq(curriculumItems.id, b.id));
    return { ok: true };
  }

  /**
   * Either party can update progress. Notifies the counterpart on completion,
   * so the shared curriculum stays visible to both.
   */
  async setStatus(
    userId: string,
    input: { id: string; status: 'planned' | 'in_progress' | 'done' },
  ) {
    const me = await this.actor.get(userId);
    const ctx = await this.itemContext(input.id, me);
    // Either party may move an item along, but a mentor who is no longer
    // approved is no longer running this programme. The mentee's side is
    // untouched.
    if (ctx.isMentor) this.requireApproved(me);

    await this.db
      .update(curriculumItems)
      .set({
        status: input.status,
        completedAt: input.status === 'done' ? new Date() : null,
      })
      .where(eq(curriculumItems.id, input.id));

    const counterpart = ctx.isMentor ? ctx.menteeId : ctx.mentorId;
    if (counterpart && input.status === 'done') {
      await dispatch({
        key: 'CURRICULUM_ITEM_DONE',
        to: counterpart,
        dedupe: input.id,
      });
    }
    return { ok: true };
  }
}
