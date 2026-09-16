import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { enquiries } from '../db/schema.js';

const TYPES = ['volunteer', 'mentor', 'partner', 'programme', 'contact'];

function clamp(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /**
   * The public "get involved" form. The ONLY unauthenticated write in the API.
   *
   * Returns { ok: false, error } rather than throwing, because every failure
   * here is shown to a member of the public mid-form and the wording is part of
   * the product. A 500 would lose what they typed and tell them nothing.
   *
   * Everything is clamped: this is the one endpoint anyone on the internet can
   * reach, and the fields land in an admin's inbox view.
   */
  async submit(type: string, data: Record<string, string>) {
    const enquiryType = TYPES.includes(type) ? type : 'contact';

    const name = clamp(data.name, 120);
    const email = clamp(data.email, 200);
    if (!name) return { ok: false, error: 'Please tell us your name.' };
    if (!email || !email.includes('@')) {
      return { ok: false, error: 'Please give us an email we can reply to.' };
    }

    // Anything the form collected beyond the core fields is kept as-is, so a
    // new field on a form does not need a migration to be captured.
    const core = new Set(['name', 'email', 'phone', 'organization', 'message']);
    const details: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (core.has(key)) continue;
      const clean = clamp(value, 1_000);
      if (clean) details[key] = clean;
    }

    try {
      await this.db.insert(enquiries).values({
        type: enquiryType,
        name,
        email,
        phone: clamp(data.phone, 40) || null,
        organization: clamp(data.organization, 160) || null,
        message: clamp(data.message, 4_000) || null,
        details: Object.keys(details).length ? details : null,
      });
      return { ok: true };
    } catch (error) {
      this.logger.error('enquiry insert failed', error);
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }
  }
}
