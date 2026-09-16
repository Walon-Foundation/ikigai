import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  appCopy,
  marketingPages,
  mediaAssets,
  pageBlocks,
  siteCopy,
} from '../db/schema.js';
import { BLOCK_DEFAULTS, isBlockType } from './block-types.js';
import {
  lines,
  requiredImageUrl,
  requiredText,
  slugify,
  text,
} from './cms-admin.helpers.js';

/**
 * Slugs the marketing site already serves from real routes. A custom page
 * claiming one of these would be shadowed by the built-in route and appear
 * broken to whoever authored it.
 */
const RESERVED_SLUGS = new Set([
  'home',
  'about',
  'contact',
  'events',
  'gallery',
  'get-involved',
  'how-it-works',
  'partners',
  'privacy',
  'programmes',
  'stories',
  'terms',
  'what-we-do',
]);

@Injectable()
export class SiteContentService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---- site copy (marketing) & app copy (in-product) ---------------------

  private siteCopyValue(key: string, v: Record<string, string>) {
    switch (key) {
      case 'hero':
        return {
          headline: text(v.headline, 200) ?? '',
          body: text(v.body, 600) ?? '',
          primaryLabel: text(v.primaryLabel, 40) ?? '',
          primaryHref: text(v.primaryHref, 200) ?? '',
          secondaryLabel: text(v.secondaryLabel, 40) ?? '',
          secondaryHref: text(v.secondaryHref, 200) ?? '',
        };
      case 'values':
        return { items: lines(v.items, 12, 60) };
      default:
        // about_intro, mission, vision — a single body paragraph.
        return { body: text(v.body, 1_500) ?? '' };
    }
  }

  private appCopyValue(key: string, v: Record<string, string>) {
    switch (key) {
      case 'pad_her_power_intro':
        return { title: text(v.title, 80) ?? '', body: text(v.body, 400) ?? '' };
      case 'safety_crisis_banner':
        return { title: text(v.title, 80) ?? '', body: text(v.body, 200) ?? '' };
      case 'dashboard_no_mentor':
        return {
          title: text(v.title, 60) ?? '',
          body: text(v.body, 200) ?? '',
          cta: text(v.cta, 40) ?? '',
        };
      default:
        // dashboard_active_modules_heading — a single label.
        return { label: text(v.label, 60) ?? '' };
    }
  }

  async saveSiteCopy(key: string, v: Record<string, string>) {
    if (!key) throw new BadRequestException('Invalid copy block');
    const value = this.siteCopyValue(key, v);
    await this.db
      .insert(siteCopy)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteCopy.key,
        set: { value, updatedAt: new Date() },
      });
    return { ok: true };
  }

  async saveAppCopy(key: string, v: Record<string, string>) {
    if (!key) throw new BadRequestException('Invalid copy block');
    const value = this.appCopyValue(key, v);
    await this.db
      .insert(appCopy)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appCopy.key,
        set: { value, updatedAt: new Date() },
      });
    return { ok: true };
  }

  // ---- media library ----------------------------------------------------

  async addMedia(url: string, label: string) {
    const clean = requiredImageUrl(url, 500, 'Image');
    const [row] = await this.db
      .insert(mediaAssets)
      .values({ url: clean, label: text(label, 120) })
      .returning({ id: mediaAssets.id });
    return { ok: true, id: row?.id };
  }

  async removeMedia(id: string) {
    await this.db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    return { ok: true };
  }

  // ---- custom marketing pages -------------------------------------------

  async savePage(id: string | null, v: Record<string, string>) {
    let title: string;
    try {
      title = requiredText(v.title, 160, 'Title');
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Invalid input',
      );
    }
    const requestedSlug = text(v.slug, 80);
    const slug = requestedSlug ? slugify(requestedSlug) : slugify(title);
    if (RESERVED_SLUGS.has(slug)) {
      throw new BadRequestException(
        `"${slug}" is a built-in page and can't be reused`,
      );
    }

    const fields = {
      title,
      metaDescription: text(v.metaDescription, 300),
      updatedAt: new Date(),
    };

    if (id) {
      await this.db
        .update(marketingPages)
        .set(fields)
        .where(eq(marketingPages.id, id));
      return { ok: true, id };
    }

    const [existing] = await this.db
      .select({ id: marketingPages.id })
      .from(marketingPages)
      .where(eq(marketingPages.slug, slug))
      .limit(1);
    if (existing) {
      throw new BadRequestException(
        `A page with slug "${slug}" already exists`,
      );
    }
    const [row] = await this.db
      .insert(marketingPages)
      .values({ ...fields, slug })
      .returning({ id: marketingPages.id });
    return { ok: true, id: row?.id };
  }

  async removePage(id: string) {
    await this.db.delete(marketingPages).where(eq(marketingPages.id, id));
    return { ok: true };
  }

  async togglePagePublish(id: string, next: boolean) {
    await this.db
      .update(marketingPages)
      .set({ published: next === true })
      .where(eq(marketingPages.id, id));
    return { ok: true };
  }

  // ---- page builder -----------------------------------------------------

  async addBlock(page: string, type: string) {
    if (!page) throw new BadRequestException('Invalid page');
    if (!isBlockType(type)) throw new BadRequestException('Unknown block type');

    const rows = await this.db
      .select({ orderIndex: pageBlocks.orderIndex })
      .from(pageBlocks)
      .where(eq(pageBlocks.page, page));
    const nextOrderIndex = rows.reduce(
      (max, r) => Math.max(max, r.orderIndex + 1),
      0,
    );

    const [row] = await this.db
      .insert(pageBlocks)
      .values({
        page,
        type,
        config: BLOCK_DEFAULTS[type],
        orderIndex: nextOrderIndex,
        published: true,
      })
      .returning({ id: pageBlocks.id });
    return { ok: true, id: row?.id };
  }

  async updateBlockConfig(id: string, config: Record<string, string>) {
    await this.db
      .update(pageBlocks)
      .set({ config, updatedAt: new Date() })
      .where(eq(pageBlocks.id, id));
    return { ok: true };
  }

  async removeBlock(id: string) {
    await this.db.delete(pageBlocks).where(eq(pageBlocks.id, id));
    return { ok: true };
  }

  async toggleBlockPublish(id: string, next: boolean) {
    await this.db
      .update(pageBlocks)
      .set({ published: next === true })
      .where(eq(pageBlocks.id, id));
    return { ok: true };
  }

  /**
   * Persist a drag-and-drop reorder in one shot: the caller sends the full list
   * of block ids in their new order and each one's orderIndex becomes its
   * position in that array.
   *
   * Unlike the CMS's up/down move (which swaps two neighbours), a drag can
   * relocate a block past several others in a single gesture, so the whole list
   * is rewritten rather than nudged one step.
   */
  async reorderBlocks(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, i) =>
        this.db
          .update(pageBlocks)
          .set({ orderIndex: i })
          .where(eq(pageBlocks.id, id)),
      ),
    );
    return { ok: true };
  }
}
