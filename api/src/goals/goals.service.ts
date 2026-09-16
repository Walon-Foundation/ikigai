import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { goals } from '../db/schema.js';
import type { CompletedGoalDto, CreateGoalDto, GoalDto } from './goals.dto.js';

@Injectable()
export class GoalsService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async list(userId: string): Promise<GoalDto[]> {
    const rows = await this.db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));

    return rows.map(toDto);
  }

  async create(userId: string, input: CreateGoalDto): Promise<GoalDto> {
    const [row] = await this.db
      .insert(goals)
      .values({
        userId,
        title: input.title,
        detail: input.detail ?? null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      })
      .returning();

    return toDto(row);
  }

  /**
   * Every write is scoped by userId as well as goal id, so one user cannot
   * complete or delete another's goal by guessing a uuid. That matched the
   * server action's `and(eq(id), eq(userId))` and must not be relaxed into a
   * lookup-then-check, which would be a TOCTOU gap.
   *
   * The `status = 'open'` clause is NOT in the action this replaces, and is a
   * deliberate fix rather than an oversight in the port. Without it, completing
   * an already-completed goal matches the row again: it returns non-null, so
   * the caller fires the "your mentee completed something" notification a
   * second time, and it overwrites completedAt, destroying the real completion
   * time. The action got away with the first of those because dispatch()
   * deduped on `${id}:done`; it did not get away with the second. Making the
   * update itself idempotent means the dedupe is defence in depth rather than
   * the only thing standing between a mentor and a duplicate notification.
   *
   * With this, null genuinely means "nothing happened" — wrong id, someone
   * else's goal, or already done.
   */
  async complete(userId: string, goalId: string): Promise<CompletedGoalDto> {
    const [done] = await this.db
      .update(goals)
      .set({ status: 'done', completedAt: new Date() })
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, userId),
          eq(goals.status, 'open'),
        ),
      )
      .returning({ id: goals.id, title: goals.title });

    return done ?? null;
  }

  async remove(userId: string, goalId: string): Promise<{ deleted: boolean }> {
    const rows = await this.db
      .delete(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
      .returning({ id: goals.id });

    return { deleted: rows.length > 0 };
  }
}

/**
 * Drizzle row -> wire shape. Dates become ISO strings because JSON has no date
 * type, and because the mobile client will parse these too — a Date that
 * survives only because Next.js happens to serialise it is a trap.
 */
function toDto(row: typeof goals.$inferSelect): GoalDto {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    targetDate: row.targetDate?.toISOString() ?? null,
    status: row.status,
    createdAt: row.createdAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}
