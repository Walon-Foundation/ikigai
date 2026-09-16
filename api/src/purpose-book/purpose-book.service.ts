import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { users } from '../db/schema.js';

const MAX_VISION = 4_000;

@Injectable()
export class PurposeBookService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /**
   * The Purpose Book's "Life Vision" module is the one free-text field the
   * mentee authors after onboarding; everything else is derived from the
   * assessment.
   */
  async saveLifeVision(userId: string, vision: unknown) {
    const text =
      typeof vision === 'string' ? vision.trim().slice(0, MAX_VISION) : '';

    const [row] = await this.db
      .select({ onboardingData: users.onboardingData })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const current = (row?.onboardingData as Record<string, unknown> | null) ?? {};

    await this.db
      .update(users)
      .set({ onboardingData: { ...current, lifeVision: text } })
      .where(eq(users.id, userId));

    return { ok: true };
  }
}
