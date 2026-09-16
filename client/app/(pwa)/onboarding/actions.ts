"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { guardianLinks, mentorDocuments, milestones, users } from "@/db/schema";
import { MAX_PERSONAL_STATEMENT } from "@/lib/constants";

// Client-supplied text reaches these actions straight off a request body, so
// every free-text field is clamped before it is stored. The caps mirror
// settings/actions.ts, which already does this for the same columns.
const MAX_BIO = 500;
const MAX_TAG_LENGTH = 60;
const MAX_TAGS = 10;

function boundedText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// interestTags feeds mentor↔mentee matching (lib/match.ts) and renders as chips
// in the marketplace. The vocabulary is open by design — the assessment lets a
// mentee type an interest that isn't on any list — so this bounds rather than
// filters: strings only, trimmed, length-capped, de-duplicated, count-capped.
function boundedTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
        .filter(Boolean),
    ),
  ].slice(0, MAX_TAGS);
}

type OnboardingData = {
  roleSelected?: boolean;
  assessment?: {
    love: string[];
    skills: string[];
    community: string[];
    opportunity: string[];
    loveText?: string;
    skillsText?: string;
    communityText?: string;
    opportunityText?: string;
  };
  valuesRanking?: string[];
  personality?: {
    introvertExtrovert: number;
    structuredFlexible: number;
    creativeAnalytical: number;
    independentCollaborative: number;
  };
  purposeProfile?: {
    statement: string;
    interests: string[];
    values: string[];
    personalityLabel: string;
  };
  mentorProfile?: {
    expertise: string[];
    industry: string;
    yearsExperience: number;
    languages: string[];
    location: string;
  };
  verificationSubmitted?: boolean;
  personalStatement?: string;
  parentProfile?: {
    relationship: string;
    phone: string;
  };
  childEmail?: string;
  inviteCode?: string;
  childLinked?: boolean;
  linkSkipped?: boolean;
};

async function getUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");
  return user;
}

async function patchOnboardingData(
  clerkId: string,
  patch: Partial<OnboardingData>,
) {
  const [user] = await db
    .select({ onboardingData: users.onboardingData })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  const current = (user?.onboardingData as OnboardingData | null) ?? {};
  await db
    .update(users)
    .set({ onboardingData: { ...current, ...patch } })
    .where(eq(users.clerkId, clerkId));
}

// Roles a user may assign to themselves during onboarding. `admin` is a member
// of the `role` pgEnum but is deliberately NOT here: `users.role` is the single
// column both authorization gates read (proxy.ts and requireAdmin() in
// lib/db-user.ts), so a self-service write to it is a write to the entire
// authorization system. The parameter's TypeScript union is erased at runtime
// and a server action's arguments come straight off the request body, so this
// list — not the type — is what actually constrains the value.
const SELF_ASSIGNABLE_ROLES = ["mentee", "mentor", "parent"] as const;
type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

export async function setRole(role: SelfAssignableRole) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }
  // Never overwrite an elevated role. Onboarding only ever moves an account off
  // the `mentee` default, so scoping the update to that state means replaying
  // this action later cannot strip an admin or an approved mentor of their role.
  await db
    .update(users)
    .set({ role })
    .where(and(eq(users.clerkId, userId), eq(users.role, "mentee")));
  await patchOnboardingData(userId, { roleSelected: true });
  if (role === "mentee") redirect("/onboarding/mentee/assessment");
  if (role === "mentor") redirect("/onboarding/mentor/profile");
  redirect("/onboarding/parent/profile");
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
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { assessment: data });
  redirect("/onboarding/mentee/values");
}

export async function saveMenteeValues(valuesRanking: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { valuesRanking });
  redirect("/onboarding/mentee/personality");
}

export async function saveMenteePersonality(personality: {
  introvertExtrovert: number;
  structuredFlexible: number;
  creativeAnalytical: number;
  independentCollaborative: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { personality });
  redirect("/onboarding/mentee/profile");
}

export async function completeMenteeOnboarding() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const user = await getUser();
  const data = (user.onboardingData as OnboardingData | null) ?? {};

  const interests = [
    ...(data.assessment?.love ?? []),
    ...(data.assessment?.opportunity ?? []),
  ].slice(0, 4);

  const values = data.valuesRanking?.slice(0, 3) ?? [];

  const pe = data.personality;
  const personalityLabel = pe
    ? [
        pe.introvertExtrovert <= 2
          ? "Introverted"
          : pe.introvertExtrovert >= 4
            ? "Extroverted"
            : "Balanced",
        pe.creativeAnalytical <= 2
          ? "Creative"
          : pe.creativeAnalytical >= 4
            ? "Analytical"
            : "Versatile",
      ].join(", ")
    : "Growth-oriented";

  const community = data.assessment?.community?.[0] ?? "community development";
  const topInterest = interests[0] ?? "personal growth";

  const statement = `You are a ${personalityLabel.toLowerCase()} individual passionate about ${topInterest.toLowerCase()} and ${community.toLowerCase()}. You are driven by ${values[0]?.toLowerCase() ?? "integrity"} and committed to making a meaningful impact.`;

  const purposeProfile = { statement, interests, values, personalityLabel };
  await patchOnboardingData(userId, { purposeProfile });

  // Promote assessment tags to the real interestTags column — matching and
  // every mentor-facing view read users.interestTags, so leaving it empty
  // (the old behaviour) broke both.
  const interestTags = boundedTags([
    ...(data.assessment?.love ?? []),
    ...(data.assessment?.skills ?? []),
    ...(data.assessment?.community ?? []),
    ...(data.assessment?.opportunity ?? []),
  ]);
  await db.update(users).set({ interestTags }).where(eq(users.clerkId, userId));

  await db
    .insert(milestones)
    .values({ userId: user.id, type: "purpose_quiz" })
    .onConflictDoNothing();

  redirect("/dashboard");
}

export async function saveMentorProfile(data: {
  bio: string;
  expertise: string[];
  industry: string;
  yearsExperience: number;
  languages: string[];
  location: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db
    // Mirror expertise into interestTags so mentor↔mentee matching and the
    // marketplace tag chips have real data to work with.
    //
    // Bounded, not allowlisted. settings/actions.ts filters this same column
    // against INTEREST_TAGS, but that list is not the vocabulary these screens
    // offer — the mentor form has its own EXPERTISE_TAGS and the mentee
    // assessment deliberately accepts typed-in interests. Allowlisting here
    // would silently discard almost every real answer. What this column cannot
    // carry is unbounded client input, since the matcher reads it and the
    // marketplace renders it, so the values are clamped instead.
    .update(users)
    .set({
      bio: boundedText(data.bio, MAX_BIO),
      interestTags: boundedTags(data.expertise),
    })
    .where(eq(users.clerkId, userId));
  await patchOnboardingData(userId, {
    mentorProfile: {
      expertise: data.expertise,
      industry: data.industry,
      yearsExperience: data.yearsExperience,
      languages: data.languages,
      location: data.location,
    },
  });
  redirect("/onboarding/mentor/verification");
}

// A mentor's application is their personal statement plus their vetting
// documents. The statement used to be dropped on the floor — the textarea was
// uncontrolled and this action took no arguments, so an applicant wrote it, hit
// Submit, and was redirected to a success page while the text went nowhere. It
// reaches the admin's review screen now.
//
// Both documents are required, and required HERE. A server action is a public
// endpoint reachable by anyone signed in, whatever page rendered it, so the
// check in verification-form.tsx guards the screen and this guards the
// application: an applicant cannot arrive in the admin's review queue with
// nothing to review, or with a CV and no proof of who wrote it.
const REQUIRED_DOCUMENTS = ["government_id", "cv"] as const;

export type RequiredDocument = (typeof REQUIRED_DOCUMENTS)[number];

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
  const user = await getUser();

  // One query for both kinds rather than one per kind — this runs while the
  // applicant waits on the Submit button, and Neon's HTTP driver charges a
  // network round-trip per statement.
  const documents = await db
    .select({ kind: mentorDocuments.kind })
    .from(mentorDocuments)
    .where(
      and(
        eq(mentorDocuments.userId, user.id),
        inArray(mentorDocuments.kind, [...REQUIRED_DOCUMENTS]),
      ),
    );

  const held = new Set(documents.map((d) => d.kind));
  const missing = REQUIRED_DOCUMENTS.filter((kind) => !held.has(kind));
  if (missing.length > 0) return { ok: false, missing };

  const statement =
    typeof personalStatement === "string"
      ? personalStatement.trim().slice(0, MAX_PERSONAL_STATEMENT)
      : "";
  await patchOnboardingData(user.clerkId, {
    verificationSubmitted: true,
    personalStatement: statement,
  });
  redirect("/dashboard");
}

export async function saveParentProfile(data: {
  displayName: string;
  relationship: string;
  phone: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db
    .update(users)
    .set({ displayName: data.displayName })
    .where(eq(users.clerkId, userId));
  await patchOnboardingData(userId, {
    parentProfile: { relationship: data.relationship, phone: data.phone },
  });
  redirect("/onboarding/parent/link");
}

// How many outstanding (unaccepted) guardian requests one parent may have.
// A guardian request renders inside the child's trusted app UI as "<name> wants
// to be your guardian", with an Accept button, in front of someone who may be
// 13. The consent gate itself is sound — nothing about the child is visible
// until they accept — but the ABILITY TO ASK is what needs bounding, so an
// adult cannot spray requests at addresses until one is tapped.
const MAX_PENDING_GUARDIAN_REQUESTS = 5;

export async function saveParentLink(childEmail: string) {
  const parent = await getUser();

  // Only a parent account may create guardian links. `saveParentLink` is a
  // server action, so it is a public endpoint reachable by any signed-in user
  // regardless of which page rendered it — the role has to be checked here
  // rather than inferred from the fact that this is a parent onboarding screen.
  if (parent.role !== "parent") throw new Error("Forbidden");

  if (!childEmail) {
    // `linkSkipped`, not just `childLinked: false`. AppLayout resumes parent
    // onboarding whenever neither `childLinked` nor `inviteCode` is set, so
    // recording only the negative sent a parent who tapped "Skip for now"
    // straight back to the page they skipped, with no other way out of
    // onboarding. This flag is what makes the skip terminal — the parent
    // dashboard already has a "No child linked yet" branch to receive them.
    await patchOnboardingData(parent.clerkId, {
      childLinked: false,
      linkSkipped: true,
    });
    redirect("/parent-portal");
  }

  const data = (parent.onboardingData as OnboardingData | null) ?? {};
  const relationship = data.parentProfile?.relationship ?? "parent";

  const pending = await db
    .select({ id: guardianLinks.id })
    .from(guardianLinks)
    .where(
      and(
        eq(guardianLinks.parentId, parent.id),
        eq(guardianLinks.status, "pending"),
      ),
    )
    .limit(MAX_PENDING_GUARDIAN_REQUESTS + 1);
  if (pending.length > MAX_PENDING_GUARDIAN_REQUESTS) {
    throw new Error(
      "You have too many pending guardian requests. Ask your child to accept one before sending another.",
    );
  }

  // Don't create a second link to the same email for this parent.
  const [existing] = await db
    .select({ id: guardianLinks.id })
    .from(guardianLinks)
    .where(
      and(
        eq(guardianLinks.parentId, parent.id),
        eq(guardianLinks.childEmail, childEmail),
      ),
    )
    .limit(1);

  if (!existing) {
    const [child] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, childEmail))
      .limit(1);

    // A request is created in 'pending' state. The child must accept it before
    // the parent can see anything — consent is the gate.
    const inviteCode = child
      ? null
      : `IK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await db.insert(guardianLinks).values({
      parentId: parent.id,
      childId: child?.id ?? null,
      childEmail,
      inviteCode,
      relationship,
      status: "pending",
    });

    // Onboarding-gate flags only; real status lives in guardianLinks.
    await patchOnboardingData(parent.clerkId, {
      childEmail,
      ...(inviteCode ? { inviteCode } : { childLinked: true }),
    });
  }

  redirect("/parent-portal");
}
