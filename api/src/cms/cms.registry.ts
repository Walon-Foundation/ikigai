import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import {
  galleryItems,
  impactStats,
  partners,
  pillars,
  programmes,
  stories,
  teamMembers,
} from '../db/schema.js';
import {
  bool,
  imageUrl,
  lines,
  requiredImageUrl,
  requiredText,
  slugify,
  text,
} from './cms-admin.helpers.js';

/**
 * One registry instead of seven near-identical modules.
 *
 * Every CMS entity supports the same four operations — save, remove, toggle
 * publish, reorder — and only `save` differs, because each table has different
 * columns and slug rules. The client had already factored the other three into
 * a shared helper; this takes the last step and makes `save` data too.
 *
 * Adding an entity is one entry here. It is not a new module, a new controller
 * or a new route.
 */

// biome-ignore lint: Drizzle's types do not generalise across arbitrary tables.
type AnyTable = any;

export type CmsEntity = {
  table: PgTable;
  id: PgColumn;
  orderIndex?: PgColumn;
  published?: PgColumn;
  /** Build the column values from submitted form fields. Throws on invalid. */
  fields: (v: Record<string, string>) => Record<string, unknown>;
  /** Extra columns set only on INSERT (slug, publishedAt, …). */
  onInsert?: (v: Record<string, string>) => Record<string, unknown>;
};

/** Parse a datetime-local string (YYYY-MM-DDTHH:mm), or null if empty/invalid. */
function parseDate(value: string | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const STORY_CATEGORIES = ['impact', 'news', 'update'];
const PILLAR_ACCENTS = ['green', 'gold', 'earth'];

export const CMS_ENTITIES: Record<string, CmsEntity> = {
  programmes: {
    table: programmes as AnyTable,
    id: programmes.id,
    orderIndex: programmes.orderIndex,
    published: programmes.published,
    fields: (v) => {
      const name = requiredText(v.name, 120, 'Name');
      const startsAt = parseDate(v.startsAt);
      const endsAt = parseDate(v.endsAt);
      if (startsAt && endsAt && endsAt < startsAt) {
        throw new Error('End date must be after start date');
      }
      return {
        name,
        pillarId: v.pillarId || null,
        summary: text(v.summary, 300),
        heroImageUrl: imageUrl(v.heroImageUrl, 500),
        about: text(v.about, 4_000),
        objectives: lines(v.objectives),
        activities: lines(v.activities),
        impactValue: text(v.impactValue, 40),
        impactLabel: text(v.impactLabel, 80),
        ctaLabel: text(v.ctaLabel, 60),
        ctaUrl: text(v.ctaUrl, 300),
        featured: bool(v.featured),
        startsAt,
        endsAt,
        // Defaults true for backwards compatibility; an explicit uncheck sends
        // "" and becomes false. A pre-migration NULL reads as true in the UI.
        allowVolunteer: bool(v.allowVolunteer),
        updatedAt: new Date(),
      };
    },
    onInsert: (v) => ({ slug: slugify(requiredText(v.name, 120, 'Name')) }),
  },

  stories: {
    table: stories as AnyTable,
    id: stories.id,
    orderIndex: stories.orderIndex,
    published: stories.published,
    fields: (v) => ({
      title: requiredText(v.title, 200, 'Title'),
      category: STORY_CATEGORIES.includes(v.category ?? '')
        ? v.category
        : 'impact',
      excerpt: text(v.excerpt, 400),
      body: text(v.body, 20_000),
      coverImageUrl: imageUrl(v.coverImageUrl, 500),
      authorName: text(v.authorName, 120),
      programmeId: v.programmeId || null,
      updatedAt: new Date(),
    }),
    onInsert: (v) => ({
      slug: slugify(requiredText(v.title, 200, 'Title')),
      // Set at authoring time so the public list (ordered by publishedAt) has a
      // stable key. The row still stays hidden until `published` is flipped.
      publishedAt: new Date(),
    }),
  },

  gallery: {
    table: galleryItems as AnyTable,
    id: galleryItems.id,
    orderIndex: galleryItems.orderIndex,
    published: galleryItems.published,
    fields: (v) => ({
      album: requiredText(v.album, 120, 'Album'),
      imageUrl: requiredImageUrl(v.imageUrl, 500, 'Image'),
      caption: text(v.caption, 300),
      programmeId: v.programmeId || null,
    }),
  },

  partners: {
    table: partners as AnyTable,
    id: partners.id,
    orderIndex: partners.orderIndex,
    published: partners.published,
    fields: (v) => ({
      name: requiredText(v.name, 160, 'Name'),
      logoUrl: imageUrl(v.logoUrl, 500),
      websiteUrl: text(v.websiteUrl, 300),
      description: text(v.description, 600),
      updatedAt: new Date(),
    }),
  },

  pillars: {
    table: pillars as AnyTable,
    id: pillars.id,
    orderIndex: pillars.orderIndex,
    published: pillars.published,
    fields: (v) => ({
      name: requiredText(v.name, 120, 'Name'),
      tagline: text(v.tagline, 200),
      description: text(v.description, 1_000),
      icon: text(v.icon, 8),
      accent: PILLAR_ACCENTS.includes(v.accent ?? '') ? v.accent : 'green',
      updatedAt: new Date(),
    }),
    onInsert: (v) => ({ slug: slugify(requiredText(v.name, 120, 'Name')) }),
  },

  impact: {
    table: impactStats as AnyTable,
    id: impactStats.id,
    orderIndex: impactStats.orderIndex,
    published: impactStats.published,
    fields: (v) => ({
      value: requiredText(v.value, 40, 'Value'),
      label: requiredText(v.label, 80, 'Label'),
      updatedAt: new Date(),
    }),
  },

  team: {
    table: teamMembers as AnyTable,
    id: teamMembers.id,
    orderIndex: teamMembers.orderIndex,
    published: teamMembers.published,
    fields: (v) => ({
      name: requiredText(v.name, 120, 'Name'),
      role: text(v.role, 120),
      bio: text(v.bio, 800),
      photoUrl: imageUrl(v.photoUrl, 500),
      updatedAt: new Date(),
    }),
  },
};

export type CmsResource = keyof typeof CMS_ENTITIES;
