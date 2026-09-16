/**
 * The one sentence a weekly summary is made of.
 *
 * Returns null for an empty week rather than a sentence full of zeroes. A
 * summary reading "0 milestones, 0 activities this week" is not encouragement,
 * and posting it every Sunday to somebody who has drifted away is precisely
 * the automated-feeling noise this system is meant not to produce. The
 * inactivity nudge is what that person gets instead.
 *
 * Pure and import-free so it can be tested without a database.
 */
export type WeekCounts = {
  milestones: number;
  tasks: number;
  journals: number;
};

export function summariseWeek(counts: WeekCounts): string | null {
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  const parts: string[] = [];
  if (counts.milestones > 0) {
    parts.push(plural(counts.milestones, "milestone", "milestones"));
  }
  if (counts.tasks > 0) parts.push(plural(counts.tasks, "task", "tasks"));
  if (counts.journals > 0) {
    parts.push(plural(counts.journals, "journal entry", "journal entries"));
  }

  if (parts.length === 0) return null;
  return `${parts.join(", ")} this week. Every small step is part of your journey.`;
}
