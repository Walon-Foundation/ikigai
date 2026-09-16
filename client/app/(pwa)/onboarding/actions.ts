"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getDbUser } from "@/lib/db-user";

// Thin callers of the API's OnboardingModule.
//
// Everything that decides anything lives there: the self-assignable role
// allowlist (admin is deliberately not on it), the "never overwrite an elevated
// role" scoping, the text and tag clamps, the required-documents check, and the
// cap on outstanding guardian requests. The Expo onboarding flow gets all of it
// for free.
//
// The API returns { next } rather than redirecting, because the mobile app has
// a navigator and no URL bar. On this surface that becomes a redirect(), which
// is what these screens have always done.

const SELF_ASSIGNABLE_ROLES = ["mentee", "mentor", "parent"] as const;
type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

type NextStep = { next: string };

async function step(path: string, body?: unknown): Promise<string> {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  const result = await apiFetch<NextStep>(path, {
    method: "POST",
    userId: me.id,
    body,
  });
  return result.next;
}

export async function setRole(role: SelfAssignableRole) {
  redirect(await step("/onboarding/role", { role }));
}

export async function saveMenteeAssessment(data: {
  love: string[];
  loveText: string;
  skills: string[];
  skillsText: string;
  community: string[];
  communityText: string;
  opportunity: string[];
  opportunityText: string;
}) {
  redirect(await step("/onboarding/mentee/assessment", data));
}

export async function saveMenteeValues(valuesRanking: string[]) {
  redirect(await step("/onboarding/mentee/values", { valuesRanking }));
}

export async function saveMenteePersonality(personality: {
  introvertExtrovert: number;
  structuredFlexible: number;
  creativeAnalytical: number;
  independentCollaborative: number;
}) {
  redirect(await step("/onboarding/mentee/personality", personality));
}

export async function completeMenteeOnboarding() {
  redirect(await step("/onboarding/mentee/complete"));
}

export async function saveMentorProfile(data: {
  bio: string;
  expertise: string[];
  industry: string;
  yearsExperience: number;
  languages: string[];
  location: string;
}) {
  redirect(await step("/onboarding/mentor/profile", data));
}

export type RequiredDocument = "government_id" | "cv";

/**
 * Why a submission was refused, returned rather than thrown.
 *
 * Next redacts a server action's error message in production — the applicant
 * would get "an error occurred" and no way to tell a missing document from a
 * database being down. Both leave them pressing Submit on a form that will
 * never accept it. The reason has to travel as a value to survive.
 */
export type MentorVerificationRefusal = {
  ok: false;
  missing: RequiredDocument[];
};

export async function submitMentorVerification(
  personalStatement: string,
): Promise<MentorVerificationRefusal | void> {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  const result = await apiFetch<NextStep | MentorVerificationRefusal>(
    "/onboarding/mentor/verification",
    { method: "POST", userId: me.id, body: { personalStatement } },
  );

  if ("ok" in result && result.ok === false) return result;
  redirect((result as NextStep).next);
}

export async function saveParentProfile(data: {
  displayName: string;
  relationship: string;
  phone: string;
}) {
  redirect(await step("/onboarding/parent/profile", data));
}

export async function saveParentLink(childEmail: string) {
  redirect(await step("/onboarding/parent/link", { childEmail }));
}
