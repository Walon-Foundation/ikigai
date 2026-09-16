import { z } from 'zod';

// Limits carried over verbatim from the server action this replaces
// (client/app/(pwa)/(app)/goals/actions.ts). They were enforced by truncation
// there; here they are enforced by validation, which is the one intentional
// behaviour change — a 300-character title is now a 400 rather than a silently
// shortened goal. Truncating user input without telling them is the worse of
// the two.
export const MAX_TITLE = 200;
export const MAX_DETAIL = 1_000;

export const createGoalSchema = z.object({
  title: z.string().trim().min(1, 'Goal title is required').max(MAX_TITLE),
  detail: z
    .string()
    .trim()
    .max(MAX_DETAIL)
    .optional()
    // "" and a whitespace-only string both mean "no detail", and the column is
    // nullable. Normalise here so the service never has to care.
    .transform((v) => (v ? v : null))
    .nullable(),
  // The action accepted any string and silently dropped an unparseable one.
  // An ISO date in, or nothing.
  targetDate: z.iso.datetime({ offset: true }).optional().nullable(),
});

export type CreateGoalDto = z.infer<typeof createGoalSchema>;

/** Shape returned to callers. Plain data — no Drizzle types cross the wire. */
export type GoalDto = {
  id: string;
  title: string;
  detail: string | null;
  targetDate: string | null;
  status: string;
  createdAt: string | null;
  completedAt: string | null;
};

/**
 * What completing a goal reports back.
 *
 * `null` when nothing was completed — the id did not exist, or belonged to
 * someone else. The caller needs to distinguish those, because completing a
 * goal is the trigger for notifying the mentee's mentor and that must not fire
 * on a no-op.
 */
export type CompletedGoalDto = { id: string; title: string } | null;
