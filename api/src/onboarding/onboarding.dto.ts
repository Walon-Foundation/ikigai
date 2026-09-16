import { z } from 'zod';

/**
 * Roles a user may assign to themselves.
 *
 * `admin` is a member of the role pgEnum and is deliberately NOT here:
 * users.role is the single column both authorization gates read, so a
 * self-service write to it is a write to the entire authorization system. A
 * TypeScript union is erased at runtime and request bodies come straight off
 * the wire, so this list — not the type — is what actually constrains it.
 */
export const SELF_ASSIGNABLE_ROLES = ['mentee', 'mentor', 'parent'] as const;
export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

export const setRoleSchema = z.object({
  role: z.enum(SELF_ASSIGNABLE_ROLES),
});

// Client-supplied text reaches these endpoints straight off a request body, so
// every free-text field is clamped before it is stored. Caps mirror the account
// module, which writes the same columns.
export const MAX_BIO = 500;
export const MAX_TAG_LENGTH = 60;
export const MAX_TAGS = 10;

export const assessmentSchema = z.object({
  love: z.array(z.string()).default([]),
  loveText: z.string().default(''),
  skills: z.array(z.string()).default([]),
  skillsText: z.string().default(''),
  community: z.array(z.string()).default([]),
  communityText: z.string().default(''),
  opportunity: z.array(z.string()).default([]),
  opportunityText: z.string().default(''),
});
export type AssessmentDto = z.infer<typeof assessmentSchema>;

export const valuesSchema = z.object({
  valuesRanking: z.array(z.string()),
});

export const personalitySchema = z.object({
  introvertExtrovert: z.number(),
  structuredFlexible: z.number(),
  creativeAnalytical: z.number(),
  independentCollaborative: z.number(),
});
export type PersonalityDto = z.infer<typeof personalitySchema>;

export const mentorProfileSchema = z.object({
  bio: z.string().default(''),
  expertise: z.array(z.string()).default([]),
  industry: z.string().default(''),
  yearsExperience: z.number().default(0),
  languages: z.array(z.string()).default([]),
  location: z.string().default(''),
});
export type MentorProfileDto = z.infer<typeof mentorProfileSchema>;

export const mentorVerificationSchema = z.object({
  personalStatement: z.string().default(''),
});

export const parentProfileSchema = z.object({
  displayName: z.string().trim().min(1),
  relationship: z.string().default('parent'),
  phone: z.string().default(''),
});
export type ParentProfileDto = z.infer<typeof parentProfileSchema>;

export const parentLinkSchema = z.object({
  /** Empty string means "skip for now". */
  childEmail: z.string().default(''),
});

export const REQUIRED_DOCUMENTS = ['government_id', 'cv'] as const;
export type RequiredDocument = (typeof REQUIRED_DOCUMENTS)[number];

/**
 * Where the client should go next.
 *
 * The server actions these replace called Next's redirect() directly. That does
 * not exist here and must not: the Expo app has its own navigator and no notion
 * of a URL path to be thrown at it. The API returns the step it decided on and
 * each client navigates in its own idiom.
 */
export type NextStep = { next: string };

/**
 * Why a mentor submission was refused — returned, not thrown.
 *
 * Next redacts a server action's error message in production, so the applicant
 * would get "an error occurred" with no way to tell a missing document from a
 * database being down. Both leave them pressing Submit on a form that will
 * never accept it. The reason has to travel as a value to survive.
 */
export type MentorVerificationRefusal = {
  ok: false;
  missing: RequiredDocument[];
};
