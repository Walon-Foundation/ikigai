import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import {
  bool,
  int,
  text as cmsText,
} from '../cms/cms-admin.helpers.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { appCopy, notificationTemplates, schools, users } from '../db/schema.js';
import {
  entryFor,
  isNotificationKey,
} from '../notifications/internal/catalog.js';
import type { NotificationChannel } from '../notifications/internal/categories.js';
import { dispatchMany } from '../notifications/internal/dispatch.js';
import {
  DEFAULT_RULES,
  RULES_KEY,
} from '../notifications/internal/templates.js';

const MAX_TITLE = 200;
const MAX_BODY = 1_000;
const MAX_URL = 300;
const CHANNELS: NotificationChannel[] = ['inapp', 'push', 'email'];
const AUDIENCES = ['all', 'mentees', 'mentors', 'parents', 'club_leads'] as const;
type Audience = (typeof AUDIENCES)[number];

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Normalise a broadcast link to an IN-APP path, or refuse it.
 *
 * The link is opened inside the app, so it must be a path. A full URL is
 * reduced to its path rather than rejected, because an admin pasting their own
 * site's URL means the page, not the origin. Anything that could still escape
 * the origin — a protocol-relative "//host", or any scheme — is refused with
 * the text they typed quoted back, since a broadcast that silently points
 * somewhere else is worse than one that fails to send.
 *
 * Exported for its tests: this is the only user-supplied value in the product
 * that is sent to every user at once.
 */
export function normalizeBroadcastUrl(raw: unknown): string {
  const input = str(raw, MAX_URL).trim();
  if (!input) return '';

  let url = input;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      url = parsed.pathname + parsed.search + parsed.hash || '/';
    } catch {
      throw new BadRequestException(
        `Link must be an in-app path like /dashboard — "${input}" is not a valid URL`,
      );
    }
  }
  if (!url.startsWith('/')) url = `/${url}`;
  if (url.startsWith('//') || url.includes(':')) {
    throw new BadRequestException(
      `Link must be an in-app path starting with / (e.g. /dashboard). You entered "${input}"`,
    );
  }
  return url;
}

@Injectable()
export class AdminNotificationsService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  private async recipientsFor(audience: Audience) {
    const select = {
      id: users.id,
      email: users.email,
      subscription: users.pushSubscription,
      prefs: users.notificationPrefs,
    };

    if (audience === 'club_leads') {
      const rows = await this.db
        .select(select)
        .from(users)
        .innerJoin(schools, eq(schools.clubLeadId, users.id))
        .where(and(isNotNull(schools.verifiedAt), isNull(users.deletedAt)));
      // A club lead running two verified schools must not be messaged twice.
      const seen = new Set<string>();
      return rows.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    }

    if (audience !== 'all') {
      const role =
        audience === 'mentees'
          ? 'mentee'
          : audience === 'mentors'
            ? 'mentor'
            : 'parent';
      return this.db
        .select(select)
        .from(users)
        .where(and(eq(users.role, role), isNull(users.deletedAt)));
    }

    return this.db.select(select).from(users).where(isNull(users.deletedAt));
  }

  /**
   * Send an admin broadcast.
   *
   * The URL normalisation is the fiddly part and it is load-bearing: the link
   * is opened inside the app, so it must be an in-app PATH. A full URL is
   * reduced to its path, a bare path gains its leading slash, and anything that
   * still looks like it could escape the origin (`//host`, or a scheme) is
   * refused with the text the admin typed quoted back at them — a broadcast
   * that silently points somewhere else is worse than one that fails to send.
   */
  async sendBroadcast(data: {
    title: string;
    body: string;
    audience: string;
    url?: string;
  }) {
    const title = str(data.title, MAX_TITLE);
    const body = str(data.body, MAX_BODY);
    if (!title) throw new BadRequestException('Title is required');
    if (!body) throw new BadRequestException('Message is required');

    const normalizedUrl = normalizeBroadcastUrl(data.url);

    const audience = (AUDIENCES as readonly string[]).includes(data.audience)
      ? (data.audience as Audience)
      : 'all';

    const recipients = await this.recipientsFor(audience);
    const result = await dispatchMany(recipients, {
      key: 'BROADCAST',
      vars: { title, body },
      url: normalizedUrl || undefined,
      broadcastId: crypto.randomUUID(),
    });

    return {
      persisted: result.persisted,
      pushed: result.pushed,
      skipped: result.skipped,
    };
  }

  /** Save one notification's copy and delivery settings. */
  async saveTemplate(key: string, v: Record<string, string>) {
    if (!isNotificationKey(key)) {
      throw new BadRequestException('Unknown notification');
    }
    const entry = entryFor(key);

    const title = cmsText(v.title, MAX_TITLE);
    const body = cmsText(v.body, MAX_BODY);
    // Half an override is worse than none: the other half would silently fall
    // back to the shipped copy and the pair would read as written by two people.
    if ((title && !body) || (body && !title)) {
      throw new BadRequestException(
        'Give both a title and a message, or clear both to use the default',
      );
    }

    const channels = CHANNELS.filter((c) => bool(v[`channel_${c}`]));
    if (channels.length === 0) {
      throw new BadRequestException(
        'Pick at least one channel, or switch the notification off instead',
      );
    }

    const enabled = bool(v.enabled);
    // The account category is not opt-out-able, and that has to be enforced
    // here as well as in the catalog — this endpoint writes the override that
    // would otherwise silence it.
    if (!enabled && entry.category === 'account') {
      throw new BadRequestException(
        "Safety and account notifications can't be switched off — they're how people find out about decisions affecting their account.",
      );
    }

    const priority = ['high', 'medium', 'low'].includes(v.priority)
      ? v.priority
      : entry.priority;

    const row = {
      title,
      body,
      enabled,
      channels,
      priority,
      cooldownHours: v.cooldownHours?.trim()
        ? int(v.cooldownHours, entry.cooldownHours ?? 0, 0, 8_760)
        : null,
      updatedAt: new Date(),
    };

    await this.db
      .insert(notificationTemplates)
      .values({ key, ...row })
      .onConflictDoUpdate({ target: notificationTemplates.key, set: row });

    return { ok: true };
  }

  /** Drop an override entirely, returning the notification to its shipped copy. */
  async resetTemplate(key: string) {
    if (!isNotificationKey(key)) {
      throw new BadRequestException('Unknown notification');
    }
    await this.db
      .delete(notificationTemplates)
      .where(eq(notificationTemplates.key, key));
    return { ok: true };
  }

  /** The global timings the scheduled jobs read. */
  async saveRules(v: Record<string, string>) {
    const value = {
      menteeInactiveDays: int(
        v.menteeInactiveDays,
        DEFAULT_RULES.menteeInactiveDays,
        1,
        365,
      ),
      menteeInactiveLongDays: int(
        v.menteeInactiveLongDays,
        DEFAULT_RULES.menteeInactiveLongDays,
        1,
        365,
      ),
      mentorInactiveDays: int(
        v.mentorInactiveDays,
        DEFAULT_RULES.mentorInactiveDays,
        1,
        365,
      ),
      weeklySummaryWeekday: int(
        v.weeklySummaryWeekday,
        DEFAULT_RULES.weeklySummaryWeekday,
        0,
        6,
      ),
    };

    if (value.menteeInactiveLongDays <= value.menteeInactiveDays) {
      throw new BadRequestException(
        'The longer-absence reminder must come after the gentle one',
      );
    }

    await this.db
      .insert(appCopy)
      .values({ key: RULES_KEY, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appCopy.key,
        set: { value, updatedAt: new Date() },
      });

    return { ok: true };
  }
}
