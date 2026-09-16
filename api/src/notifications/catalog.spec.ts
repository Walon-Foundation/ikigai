import { describe, expect, it } from 'vitest';
import { CATALOG, NOTIFICATION_KEYS, resolveUrl } from './internal/catalog.js';
import { isAlwaysOn, resolveChannels } from './internal/categories.js';

/**
 * The catalog is a promise that each of these can actually be delivered, to the
 * right person, on a channel that reaches them. These are the invariants that
 * make it one.
 *
 * NOTE this is the API's copy. client/lib/notifications/catalog.ts still exists
 * and is still used by the surfaces that have not moved, so the two can drift —
 * the same hazard the schema has, without the schema's guard. It goes away when
 * the client stops dispatching.
 */
describe('notification catalog', () => {
  it('has every declared key', () => {
    expect(NOTIFICATION_KEYS.length).toBeGreaterThan(0);
    expect(NOTIFICATION_KEYS.length).toBe(Object.keys(CATALOG).length);
  });

  it('gives every notification somewhere to go', () => {
    // A notification a person can tap that leads nowhere is worse than none.
    for (const key of NOTIFICATION_KEYS) {
      const url = resolveUrl(CATALOG[key].url, {
        mentorshipId: 'm',
        taskId: 't',
        reportId: 'r',
        menteeId: 'u',
        groupId: 'g',
      });
      expect(url, key).toBeTruthy();
      expect(url.startsWith('/'), `${key} -> ${url}`).toBe(true);
    }
  });

  it('never leaves an account-category notification opt-out-able', () => {
    // Approvals, rejections, safeguarding alerts and admin broadcasts are how
    // people find out about decisions affecting their account.
    for (const key of NOTIFICATION_KEYS) {
      if (CATALOG[key].category === 'account') {
        expect(isAlwaysOn('account'), key).toBe(true);
      }
    }
  });

  it('never gives a low-priority notification a push channel', () => {
    // "low" is in-app only by design, which makes it wrong for anything aimed
    // at someone who is not currently in the app — an inactivity reminder
    // delivered only to the in-app feed cannot reach the inactive person it is
    // for. This checks the rule holds, not that every entry uses it well.
    for (const key of NOTIFICATION_KEYS) {
      const entry = CATALOG[key];
      if (entry.priority !== 'low') continue;
      const channels = resolveChannels({
        category: entry.category,
        priority: entry.priority,
        channels: entry.channels,
        prefs: {} as never,
      });
      expect(channels.includes('push'), key).toBe(false);
    }
  });

  it('routes admin-audience notifications to admin paths', () => {
    // These are rewritten to an absolute admin URL at dispatch, because the
    // admin panel is a different origin — a relative path would resolve against
    // the PWA.
    const adminKeys = NOTIFICATION_KEYS.filter(
      (k) => CATALOG[k].audience === 'admin',
    );
    expect(adminKeys.length).toBeGreaterThan(0);
    for (const key of adminKeys) {
      const url = resolveUrl(CATALOG[key].url, { reportId: 'r' });
      expect(url.startsWith('/'), `${key} -> ${url}`).toBe(true);
    }
  });

  it('gives every entry a title and a body', () => {
    for (const key of NOTIFICATION_KEYS) {
      expect(CATALOG[key].title?.length, key).toBeGreaterThan(0);
      expect(CATALOG[key].body?.length, key).toBeGreaterThan(0);
    }
  });

  it("carries the admin's own words through a broadcast", () => {
    expect(CATALOG.BROADCAST.title).toContain('{{title}}');
    expect(CATALOG.BROADCAST.body).toContain('{{body}}');
  });
});
