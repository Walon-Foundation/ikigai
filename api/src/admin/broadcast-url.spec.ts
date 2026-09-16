import { describe, expect, it } from 'vitest';
import { normalizeBroadcastUrl } from './admin-notifications.service.js';

/**
 * A broadcast goes to every user on the platform at once, and its link is the
 * only user-supplied value in the product with that reach. If this lets an
 * absolute URL through, one admin action sends every user — most of them minors
 * — to somewhere off-origin.
 */
describe('normalizeBroadcastUrl', () => {
  it('passes an ordinary in-app path through', () => {
    expect(normalizeBroadcastUrl('/dashboard')).toBe('/dashboard');
    expect(normalizeBroadcastUrl('/groups?tab=mine')).toBe('/groups?tab=mine');
  });

  it('adds the leading slash to a bare path', () => {
    expect(normalizeBroadcastUrl('dashboard')).toBe('/dashboard');
  });

  it('reduces a full URL to its path, rather than rejecting it', () => {
    // An admin pasting their own site's URL means the page, not the origin.
    expect(normalizeBroadcastUrl('https://findingyourikigai.org/events')).toBe(
      '/events',
    );
    expect(
      normalizeBroadcastUrl('https://example.test/events?a=1#top'),
    ).toBe('/events?a=1#top');
  });

  it('refuses a protocol-relative URL', () => {
    // "//evil.test" inherits the current scheme and leaves the origin.
    expect(() => normalizeBroadcastUrl('//evil.test')).toThrow(
      /in-app path starting with/,
    );
  });

  it('refuses any scheme', () => {
    for (const bad of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'mailto:someone@example.test',
      'file:///etc/passwd',
    ]) {
      expect(() => normalizeBroadcastUrl(bad), bad).toThrow();
    }
  });

  it('quotes what the admin typed back at them', () => {
    // So the message is actionable rather than "invalid link".
    expect(() => normalizeBroadcastUrl('//evil.test')).toThrow(/\/\/evil\.test/);
  });

  it('treats empty and non-string input as no link', () => {
    expect(normalizeBroadcastUrl('')).toBe('');
    expect(normalizeBroadcastUrl('   ')).toBe('');
    expect(normalizeBroadcastUrl(undefined)).toBe('');
    expect(normalizeBroadcastUrl(null)).toBe('');
    expect(normalizeBroadcastUrl(42)).toBe('');
  });
});
