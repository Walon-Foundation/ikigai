import { z } from 'zod';

export const MAX_NAME = 80;
export const MAX_BIO = 500;
export const MAX_TAGS = 8;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Name can't be empty").max(MAX_NAME),
  bio: z
    .string()
    .trim()
    .max(MAX_BIO)
    .optional()
    .transform((v) => (v ? v : null))
    .nullable(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const updateInterestsSchema = z.object({
  tags: z.array(z.string()).max(64),
});
export type UpdateInterestsDto = z.infer<typeof updateInterestsSchema>;

export const journalDefaultSchema = z.object({
  /** true = the mentee is happy for their mentor to read new entries. */
  mentorCanSee: z.boolean(),
});
export type JournalDefaultDto = z.infer<typeof journalDefaultSchema>;

export const notificationPrefsSchema = z.object({
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  categories: z.record(z.string(), z.boolean()).optional(),
});
export type NotificationPrefsDto = z.infer<typeof notificationPrefsSchema>;
