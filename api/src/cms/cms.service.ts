import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { moveInOrder } from './cms-admin.helpers.js';
import { CMS_ENTITIES, type CmsEntity } from './cms.registry.js';

// biome-ignore lint: Drizzle's types do not generalise across arbitrary tables.
type AnyTable = any;

/**
 * Generic CRUD for every ordered, publishable CMS table.
 *
 * Note there is NO cache invalidation here, and that is correct rather than
 * missing: the public pages read the database per request (force-dynamic), so
 * an edit is live on the very next request. Only the admin's own list view
 * needs refreshing, which is the caller's concern, not the API's.
 */
@Injectable()
export class CmsService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  private entity(resource: string): CmsEntity {
    const entity = CMS_ENTITIES[resource];
    if (!entity) throw new NotFoundException(`Unknown CMS resource`);
    return entity;
  }

  async save(
    resource: string,
    id: string | null,
    values: Record<string, string>,
  ) {
    const e = this.entity(resource);

    let fields: Record<string, unknown>;
    try {
      fields = e.fields(values);
    } catch (error) {
      // The field builders throw plain Errors with the message an editor needs
      // to see ("Name is required", "End date must be after start date").
      // Surfacing that verbatim is the point — a generic 400 would send them
      // back to guess which field was wrong.
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid input',
      );
    }

    if (id) {
      await this.db
        .update(e.table as AnyTable)
        .set(fields)
        .where(eq(e.id, id));
      return { ok: true, id };
    }

    const [row] = await this.db
      .insert(e.table as AnyTable)
      .values({
        ...fields,
        ...(e.onInsert ? e.onInsert(values) : {}),
        ...(e.orderIndex ? { orderIndex: await this.nextOrderIndex(e) } : {}),
      })
      .returning({ id: e.id });
    return { ok: true, id: row?.id };
  }

  async remove(resource: string, id: string) {
    const e = this.entity(resource);
    await this.db.delete(e.table as AnyTable).where(eq(e.id, id));
    return { ok: true };
  }

  async togglePublish(resource: string, id: string, next: boolean) {
    const e = this.entity(resource);
    if (!e.published) {
      throw new BadRequestException('This resource is not publishable');
    }
    await this.db
      .update(e.table as AnyTable)
      .set({ published: next === true })
      .where(eq(e.id, id));
    return { ok: true, published: next === true };
  }

  async move(resource: string, id: string, dir: 'up' | 'down') {
    const e = this.entity(resource);
    if (!e.orderIndex) {
      throw new BadRequestException('This resource is not ordered');
    }
    const rows = (await this.db
      .select({ id: e.id })
      .from(e.table as AnyTable)
      .orderBy(asc(e.orderIndex))) as { id: string }[];

    await moveInOrder({
      rows,
      id,
      dir,
      apply: (rowId, orderIndex) =>
        this.db
          .update(e.table as AnyTable)
          .set({ orderIndex })
          .where(eq(e.id, rowId))
          .then(() => undefined),
    });
    return { ok: true };
  }

  /** The next orderIndex for an appended row: one past the current max. */
  private async nextOrderIndex(e: CmsEntity): Promise<number> {
    if (!e.orderIndex) return 0;
    const rows = (await this.db
      .select({ orderIndex: e.orderIndex })
      .from(e.table as AnyTable)) as { orderIndex: number | null }[];
    return rows.reduce((max, r) => Math.max(max, (r.orderIndex ?? 0) + 1), 0);
  }
}
