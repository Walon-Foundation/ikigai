import { describe, expect, it } from 'vitest';
import { CMS_ENTITIES } from './cms.registry.js';

/**
 * The registry replaced seven near-identical modules. That is a good trade only
 * while every entry is complete — a missing `published` or `orderIndex` handle
 * turns a working screen into a 400 that nothing catches at compile time,
 * because the columns are looked up dynamically.
 */
describe('CMS registry', () => {
  const names = Object.keys(CMS_ENTITIES);

  it('covers every CMS entity the admin panel offers', () => {
    expect(names.sort()).toEqual([
      'gallery',
      'impact',
      'partners',
      'pillars',
      'programmes',
      'stories',
      'team',
    ]);
  });

  describe('each entity is fully wired', () => {
    for (const name of names) {
      it(name, () => {
        const e = CMS_ENTITIES[name];
        expect(e.table).toBeDefined();
        expect(e.id).toBeDefined();
        // Every one of these is ordered and publishable in the admin UI, so a
        // missing handle here is a broken button there.
        expect(e.orderIndex).toBeDefined();
        expect(e.published).toBeDefined();
        expect(typeof e.fields).toBe('function');
      });
    }
  });

  describe('required fields are enforced server-side', () => {
    const required: Record<string, Record<string, string>> = {
      programmes: {},
      stories: {},
      pillars: {},
      partners: {},
      team: {},
      impact: { label: 'Girls reached' }, // value missing
      gallery: { album: 'Camp' }, // image missing
    };

    for (const [name, input] of Object.entries(required)) {
      it(`${name} rejects an empty submission`, () => {
        expect(() => CMS_ENTITIES[name].fields(input)).toThrow();
      });
    }
  });

  it('programmes refuses an end date before its start date', () => {
    expect(() =>
      CMS_ENTITIES.programmes.fields({
        name: 'Camp',
        startsAt: '2026-12-01T00:00',
        endsAt: '2026-01-01T00:00',
      }),
    ).toThrow(/End date must be after start date/);
  });

  it('programmes accepts a valid range', () => {
    expect(() =>
      CMS_ENTITIES.programmes.fields({
        name: 'Camp',
        startsAt: '2026-01-01T00:00',
        endsAt: '2026-12-01T00:00',
      }),
    ).not.toThrow();
  });

  it('slug-bearing entities derive one on insert', () => {
    for (const name of ['programmes', 'stories', 'pillars']) {
      const e = CMS_ENTITIES[name];
      expect(e.onInsert).toBeDefined();
      const key = name === 'stories' ? 'title' : 'name';
      const out = e.onInsert?.({ [key]: 'Pad Her Power' }) ?? {};
      expect(out.slug).toBe('pad-her-power');
    }
  });

  it('falls back to a safe value for an unknown enum rather than storing it', () => {
    // A crafted request must not be able to put an arbitrary string into a
    // column the public site switches on.
    const story = CMS_ENTITIES.stories.fields({
      title: 'A story',
      category: 'javascript:alert(1)',
    });
    expect(story.category).toBe('impact');

    const pillar = CMS_ENTITIES.pillars.fields({
      name: 'Wellness',
      accent: 'not-a-colour',
    });
    expect(pillar.accent).toBe('green');
  });
});
