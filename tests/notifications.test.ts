import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CATALOG,
  type CatalogEntry,
  entryFor,
  isNotificationKey,
  NOTIFICATION_KEYS,
  resolveUrl,
} from "@/lib/notifications/catalog";
import {
  CATEGORIES,
  categoryEnabled,
  isAlwaysOn,
  readPrefs,
  render,
  resolveChannels,
  SETTABLE_CATEGORIES,
} from "@/lib/notifications/categories";

describe("render", () => {
  test("fills placeholders from vars", () => {
    expect(
      render("{{mentee}} completed {{skill}}", {
        mentee: "Aminata",
        skill: "Public Speaking",
      }),
    ).toBe("Aminata completed Public Speaking");
  });

  test("leaves an unknown placeholder standing rather than blanking it", () => {
    // "{{mentee}} completed a milestone" reads as a bug and gets fixed;
    // " completed a milestone" reads as a sentence and ships.
    expect(render("{{mentee}} completed a milestone")).toBe(
      "{{mentee}} completed a milestone",
    );
  });

  test("an empty string counts as missing", () => {
    expect(render("Hello {{name}}", { name: "" })).toBe("Hello {{name}}");
  });

  test("a template with no placeholders is returned unchanged", () => {
    expect(render("Take one small step today.", { x: "y" })).toBe(
      "Take one small step today.",
    );
  });
});

describe("readPrefs", () => {
  test("anything unreadable means everything is on", () => {
    for (const value of [null, undefined, "on", 7, []]) {
      const prefs = readPrefs(value);
      expect(prefs.push).toBeUndefined();
      expect(categoryEnabled(prefs, "progress")).toBe(true);
    }
  });

  test("drops categories that do not exist and non-boolean values", () => {
    const prefs = readPrefs({
      categories: { progress: false, nonsense: false, messages: "no" },
    });
    expect(prefs.categories).toEqual({ progress: false });
  });
});

describe("resolveChannels", () => {
  const all = ["inapp", "push", "email"] as const;

  test("delivers everything when the user has expressed no preference", () => {
    expect(
      resolveChannels({
        channels: all,
        category: "progress",
        priority: "medium",
        prefs: {},
      }),
    ).toEqual(["inapp", "push", "email"]);
  });

  test("a switched-off category delivers nothing at all", () => {
    // Not even the in-app row: a feed entry the user asked not to receive is
    // still a notification.
    expect(
      resolveChannels({
        channels: all,
        category: "community",
        priority: "medium",
        prefs: { categories: { community: false } },
      }),
    ).toEqual([]);
  });

  test("low priority never pushes, but still lands in the app", () => {
    expect(
      resolveChannels({
        channels: all,
        category: "summary",
        priority: "low",
        prefs: {},
      }),
    ).toEqual(["inapp", "email"]);
  });

  test("the push and email master switches drop only their own channel", () => {
    expect(
      resolveChannels({
        channels: all,
        category: "progress",
        priority: "high",
        prefs: { push: false },
      }),
    ).toEqual(["inapp", "email"]);

    expect(
      resolveChannels({
        channels: all,
        category: "progress",
        priority: "high",
        prefs: { email: false },
      }),
    ).toEqual(["inapp", "push"]);
  });

  test("an account notification ignores every preference", () => {
    // A regression here means a young person can opt out of the response to
    // their own safety report, or of being told their account was actioned.
    expect(
      resolveChannels({
        channels: all,
        category: "account",
        priority: "low",
        prefs: {
          push: false,
          email: false,
          categories: { account: false } as never,
        },
      }),
    ).toEqual(["inapp", "push", "email"]);
  });

  test("account is the only always-on category", () => {
    expect(CATEGORIES.filter((c) => c.alwaysOn).map((c) => c.id)).toEqual([
      "account",
    ]);
    expect(isAlwaysOn("account")).toBe(true);
    expect(SETTABLE_CATEGORIES.some((c) => c.id === "account")).toBe(false);
  });
});

describe("catalogue integrity", () => {
  const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
  const PRIORITIES = new Set(["high", "medium", "low"]);
  const CHANNELS = new Set(["inapp", "push", "email"]);
  const LEGACY = new Set([
    "nudge",
    "match",
    "milestone",
    "broadcast",
    "task",
    "guardian",
  ]);

  const entries: [string, CatalogEntry][] = NOTIFICATION_KEYS.map((key) => [
    key,
    entryFor(key),
  ]);

  test("the catalogue is not empty and every key round-trips", () => {
    expect(NOTIFICATION_KEYS.length).toBeGreaterThan(0);
    for (const key of NOTIFICATION_KEYS)
      expect(isNotificationKey(key)).toBe(true);
    expect(isNotificationKey("NOT_A_REAL_KEY")).toBe(false);
  });

  test("every entry has copy and a valid category, priority and channel set", () => {
    for (const [key, entry] of entries) {
      expect(entry.title.trim().length, `${key} title`).toBeGreaterThan(0);
      expect(entry.body.trim().length, `${key} body`).toBeGreaterThan(0);
      expect(CATEGORY_IDS.has(entry.category), `${key} category`).toBe(true);
      expect(PRIORITIES.has(entry.priority), `${key} priority`).toBe(true);
      expect(LEGACY.has(entry.legacyType), `${key} legacyType`).toBe(true);
      expect(entry.channels.length, `${key} channels`).toBeGreaterThan(0);
      for (const channel of entry.channels) {
        expect(CHANNELS.has(channel), `${key} channel ${channel}`).toBe(true);
      }
    }
  });

  test("every URL resolves to a path, with and without vars", () => {
    for (const [key, entry] of entries) {
      for (const vars of [
        {},
        {
          menteeId: "m1",
          mentorshipId: "s1",
          taskId: "t1",
          groupId: "g1",
          eventId: "e1",
          reportId: "r1",
        },
      ]) {
        const url = resolveUrl(entry.url, vars);
        expect(typeof url, `${key} url type`).toBe("string");
        expect(url.startsWith("/"), `${key} url "${url}"`).toBe(true);
        // A builder given no vars must not produce a dangling path segment
        // that 404s — every one falls back to a real route.
        expect(
          url.endsWith("/"),
          `${key} url "${url}" has an empty segment`,
        ).toBe(false);
      }
    }
  });

  test("no low-priority notification is aimed at someone who is away", () => {
    // Low priority means in-app only. A re-engagement nudge delivered only to
    // the app is unreachable by definition — the person is not in the app.
    for (const [key, entry] of entries) {
      if (entry.category === "reminders") {
        expect(entry.priority, `${key} is a reminder`).not.toBe("low");
      }
    }
  });

  test("mentor-facing notifications never link to a mentee-only route", () => {
    // /journey is requireRole(["mentee"]) — a mentor tapping one of these would
    // be bounced to their dashboard with no explanation.
    for (const [key, entry] of entries) {
      if (entry.audience !== "mentor") continue;
      const url = resolveUrl(entry.url, { menteeId: "m1", mentorshipId: "s1" });
      expect(url.startsWith("/journey"), `${key} links to ${url}`).toBe(false);
    }
  });

  test("cooldowns are positive whole numbers of hours when set", () => {
    for (const [key, entry] of entries) {
      if (entry.cooldownHours === undefined) continue;
      expect(Number.isInteger(entry.cooldownHours), `${key} cooldown`).toBe(
        true,
      );
      expect(entry.cooldownHours, `${key} cooldown`).toBeGreaterThan(0);
    }
  });

  test("the always-on category is used only for account-level events", () => {
    const accountKeys = entries
      .filter(([, e]) => e.category === "account")
      .map(([k]) => k);
    // Guards against a future entry being parked in "account" to dodge the
    // preference check. Every one of these is an approval, a safeguarding
    // alert, or a platform-wide announcement.
    for (const key of accountKeys) {
      expect(
        /APPROVED|REJECTED|BROADCAST|SAFETY|FLAGGED|GUARDIAN/.test(key),
        `${key} is in the account category`,
      ).toBe(true);
    }
  });

  test("BROADCAST carries the admin's own words through", () => {
    expect(CATALOG.BROADCAST.title).toContain("{{title}}");
    expect(CATALOG.BROADCAST.body).toContain("{{body}}");
  });
});

describe("every notification has somewhere to come from", () => {
  // The bug this exists to stop already happened once: the original
  // NotifyType union carried a "guardian" member that no code ever emitted, so
  // a whole category of notification looked implemented and sent nothing. A
  // catalogue is a promise that these can be delivered — this checks the
  // promise against the source.
  function sources(dir: string, found: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === ".next") continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) sources(path, found);
      else if (/\.tsx?$/.test(path)) found.push(path);
    }
    return found;
  }

  const code = sources("app")
    .concat(sources("lib").filter((p) => !p.includes("notifications/catalog")))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");

  test("no catalogue key is declared and never dispatched", () => {
    const orphans = NOTIFICATION_KEYS.filter(
      (key) => !new RegExp(`["']${key}["']`).test(code),
    );
    expect(orphans).toEqual([]);
  });
});

describe("weekly summary copy", () => {
  test("never reports a zero", async () => {
    // A summary that says "0 milestones, 0 activities" is not encouragement,
    // and sending it every week to someone who has drifted away is exactly the
    // behaviour the no-spam rule exists to prevent. The jobs skip anyone with
    // an empty week; this guards the sentence itself.
    const { summariseWeek } = await import("@/lib/notifications/summary");
    expect(summariseWeek({ milestones: 2, tasks: 0, journals: 1 })).toBe(
      "2 milestones, 1 journal entry this week. Every small step is part of your journey.",
    );
    expect(summariseWeek({ milestones: 1, tasks: 1, journals: 1 })).toBe(
      "1 milestone, 1 task, 1 journal entry this week. Every small step is part of your journey.",
    );
    expect(summariseWeek({ milestones: 0, tasks: 0, journals: 0 })).toBeNull();
  });
});
