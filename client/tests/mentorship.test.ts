import { describe, expect, test } from "bun:test";
import {
  BASE_MENTORSHIP_MONTHS,
  baseEndDate,
  STAGE_MIN_DAYS,
  STAGE_MIN_TASKS,
} from "@/lib/mentorship";

describe("baseEndDate", () => {
  test("a base mentorship runs three months", () => {
    expect(BASE_MENTORSHIP_MONTHS).toBe(3);
    const end = baseEndDate(new Date("2026-01-15T09:00:00Z"));
    expect(end.toISOString().slice(0, 10)).toBe("2026-04-15");
  });

  test("does not mutate the date it was given", () => {
    const start = new Date("2026-01-15T09:00:00Z");
    baseEndDate(start);
    expect(start.toISOString().slice(0, 10)).toBe("2026-01-15");
  });

  test("crosses a year boundary", () => {
    const end = baseEndDate(new Date("2026-11-10T00:00:00Z"));
    expect(end.toISOString().slice(0, 10)).toBe("2027-02-10");
  });

  test("lands in the right month when the day does not exist", () => {
    // 30 Nov + 3 months has no 30 Feb. The end date must stay inside February,
    // not roll forward into March — a mentorship must not silently gain days
    // because of the month it started in.
    const end = baseEndDate(new Date("2026-11-30T00:00:00Z"));
    expect(end.getUTCMonth()).toBe(1); // February
  });

  test("31 Jan + 3 months stays in April", () => {
    const end = baseEndDate(new Date("2026-01-31T00:00:00Z"));
    expect(end.getUTCMonth()).toBe(3); // April
  });
});

test("the pacing floor is two weeks and a task count", () => {
  expect(STAGE_MIN_DAYS).toBe(14);
  expect(STAGE_MIN_TASKS).toBeGreaterThan(0);
});
