import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { users } from '../db/schema.js';
import { INTEREST_TAGS } from '../common/constants.js';
import { DELETION_GRACE_DAYS } from '../common/deletion.js';
import {
  type NotificationCategory,
  type NotificationPrefs,
  SETTABLE_CATEGORIES,
} from '../notifications/internal/categories.js';
import { isStorableSubscription } from '../notifications/internal/subscription.js';
import { MAX_TAGS } from './account.dto.js';
import type {
  JournalDefaultDto,
  NotificationPrefsDto,
  UpdateInterestsDto,
  UpdateProfileDto,
} from './account.dto.js';

@Injectable()
export class AccountService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async updateProfile(userId: string, input: UpdateProfileDto) {
    await this.db
      .update(users)
      .set({ displayName: input.displayName, bio: input.bio ?? null })
      .where(eq(users.id, userId));
    return { ok: true };
  }

  /**
   * Interests are not decoration: users.interestTags is what the matcher reads,
   * so changing them changes who this person is matched with.
   *
   * Allowlisted against the known tags — never persist arbitrary client strings
   * into a column the matcher trusts.
   */
  async updateInterests(userId: string, input: UpdateInterestsDto) {
    const clean = [
      ...new Set(input.tags.filter((t) => INTEREST_TAGS.includes(t))),
    ].slice(0, MAX_TAGS);

    await this.db
      .update(users)
      .set({ interestTags: clean })
      .where(eq(users.id, userId));
    return { ok: true, tags: clean };
  }

  async updateJournalDefault(userId: string, input: JournalDefaultDto) {
    await this.db
      .update(users)
      .set({
        journalDefaultVisibility: input.mentorCanSee
          ? 'mentor_only'
          : 'private',
      })
      .where(eq(users.id, userId));
    return { ok: true };
  }

  /** `null` clears the subscription — the user turned push off. */
  async savePushSubscription(userId: string, subscription: unknown) {
    if (subscription === null) {
      await this.db
        .update(users)
        .set({ pushSubscription: null })
        .where(eq(users.id, userId));
      return { ok: true };
    }

    if (!isStorableSubscription(subscription)) {
      throw new BadRequestException('Invalid push subscription');
    }

    await this.db
      .update(users)
      .set({ pushSubscription: subscription })
      .where(eq(users.id, userId));
    return { ok: true };
  }

  /**
   * Per-category notification preferences.
   *
   * Written as a whole object rather than one flag at a time: the Settings
   * screen holds the complete state anyway, and a partial write would need a
   * read-modify-write for every tap of every checkbox.
   *
   * Categories marked alwaysOn are not in SETTABLE_CATEGORIES and are dropped
   * here rather than trusted from the client — otherwise a hand-crafted request
   * could switch off safeguarding and account notifications, which is exactly
   * the thing this product does not offer.
   */
  async updateNotificationPrefs(userId: string, input: NotificationPrefsDto) {
    const settable = new Set<string>(SETTABLE_CATEGORIES.map((c) => c.id));
    const categories: Partial<Record<NotificationCategory, boolean>> = {};
    for (const [key, on] of Object.entries(input.categories ?? {})) {
      if (settable.has(key) && typeof on === 'boolean') {
        categories[key as NotificationCategory] = on;
      }
    }

    const prefs: NotificationPrefs = {
      push: input.push !== false,
      email: input.email !== false,
      categories,
    };

    await this.db
      .update(users)
      .set({ notificationPrefs: prefs })
      .where(eq(users.id, userId));
    return { ok: true, prefs };
  }

  /**
   * Ask for the account to be deleted.
   *
   * Marks the account rather than erasing it. The purge runs after a grace
   * period and cancelling restores it. Many mentees here are minors; an
   * impulsive deletion at a bad moment should be recoverable, and an
   * irreversible button that fires on one tap is the wrong shape for this
   * platform.
   */
  async requestDeletion(userId: string) {
    await this.db
      .update(users)
      .set({ deletionRequestedAt: new Date() })
      .where(eq(users.id, userId));
    return { graceDays: DELETION_GRACE_DAYS };
  }

  async cancelDeletion(userId: string) {
    await this.db
      .update(users)
      .set({ deletionRequestedAt: null })
      .where(eq(users.id, userId));
    return { ok: true };
  }
}
