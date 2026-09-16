import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { pushNotifications, users } from '../db/schema.js';
import {
  dispatch,
  dispatchMany,
  dispatchToAdmins,
} from './internal/dispatch.js';
import { isStorableSubscription } from './internal/subscription.js';

export type FeedItem = {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  url: string | null;
  read: boolean;
  timestamp: string;
};

@Injectable()
export class NotificationsService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // Sending is delegated to the ported internals, which carry the 39-key
  // catalog, per-category preferences, cooldowns, admin template overrides and
  // both transports. They are exposed here so the rest of the API depends on a
  // provider rather than reaching into ./internal.
  readonly dispatch = dispatch;
  readonly dispatchMany = dispatchMany;
  readonly dispatchToAdmins = dispatchToAdmins;

  /**
   * The in-app feed for one user.
   *
   * Every signed-in client polls this on an interval, on every page, for as
   * long as the app is open — it is the most frequently executed query in the
   * product and the only one paid for while the user does nothing. Keep it one
   * round-trip.
   */
  async feed(userId: string): Promise<{ unread: number; items: FeedItem[] }> {
    const rows = await this.db
      .select({
        id: pushNotifications.id,
        title: pushNotifications.title,
        body: pushNotifications.body,
        type: pushNotifications.type,
        url: pushNotifications.url,
        readAt: pushNotifications.readAt,
        sentAt: pushNotifications.sentAt,
        // The true unread total, not the unread count of this page.
        //
        // This was once `rows.filter(r => !r.readAt).length` over the 30 rows
        // below, so the bell silently stopped counting at 30 — someone back
        // after a fortnight saw the same badge whether they had 30 unread or
        // 300, and clearing 20 moved it not at all.
        //
        // A window function rather than a second query: window functions are
        // evaluated before LIMIT, so this counts every matching row while
        // still returning one page, and the poll stays a single round-trip.
        unread: sql<number>`count(*) filter (where ${pushNotifications.readAt} is null) over ()`,
      })
      .from(pushNotifications)
      .where(eq(pushNotifications.userId, userId))
      .orderBy(desc(pushNotifications.sentAt))
      .limit(30);

    return {
      unread: Number(rows[0]?.unread ?? 0),
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        type: r.type,
        url: r.url,
        read: !!r.readAt,
        timestamp: r.sentAt?.toISOString() ?? new Date().toISOString(),
      })),
    };
  }

  /** Mark one notification read, or all of them when `id` is omitted. */
  async markRead(userId: string, id?: string): Promise<{ ok: true }> {
    await this.db
      .update(pushNotifications)
      .set({ readAt: new Date() })
      .where(
        id
          ? and(
              eq(pushNotifications.userId, userId),
              eq(pushNotifications.id, id),
              isNull(pushNotifications.readAt),
            )
          : and(
              eq(pushNotifications.userId, userId),
              isNull(pushNotifications.readAt),
            ),
      );
    return { ok: true };
  }

  /**
   * Store a rotated push subscription.
   *
   * Browsers reissue subscriptions on their own schedule — after a long idle
   * period, a profile change, or a push-service migration. The old endpoint
   * starts returning 410 and gets pruned, so without this the user's push
   * simply stopped one day, permanently, with the Settings toggle still
   * reading "on" and nothing to indicate anything had happened.
   *
   * Authenticated on purpose: matching on the old endpoint alone would let
   * anyone who learned an endpoint repoint that user's notifications at their
   * own device.
   */
  async saveSubscription(
    userId: string,
    subscription: unknown,
  ): Promise<{ ok: boolean }> {
    if (!isStorableSubscription(subscription)) {
      return { ok: false };
    }
    await this.db
      .update(users)
      .set({ pushSubscription: subscription })
      .where(eq(users.id, userId));
    return { ok: true };
  }
}
