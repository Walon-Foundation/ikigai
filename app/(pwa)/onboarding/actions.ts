"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { guardianLinks, milestones, users } from "@/db/schema";

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
  mentorPricing?: {
    hourlyRate: number;
    packageTypes: string[];
    availability: string[];
  };
  verificationSubmitted?: boolean;
  parentProfile?: {
    relationship: string;
    phone: string;
  };
  childEmail?: string;
  inviteCode?: string;
  childLinked?: boolean;
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

export async function setRole(role: "mentee" | "mentor" | "parent") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await db.update(users).set({ role }).where(eq(users.clerkId, userId));
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
  const interestTags = [
    ...new Set([
      ...(data.assessment?.love ?? []),
      ...(data.assessment?.skills ?? []),
      ...(data.assessment?.community ?? []),
      ...(data.assessment?.opportunity ?? []),
    ]),
  ].slice(0, 10);
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
    .update(users)
    .set({ bio: data.bio, interestTags: data.expertise })
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
  redirect("/onboarding/mentor/pricing");
}

export async function saveMentorPricing(data: {
  hourlyRate: number;
  packageTypes: string[];
  availability: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { mentorPricing: data });
  redirect("/onboarding/mentor/verification");
}

export async function submitMentorVerification() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  await patchOnboardingData(userId, { verificationSubmitted: true });
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

export async function saveParentLink(childEmail: string) {
  const parent = await getUser();

  if (!childEmail) {
    await patchOnboardingData(parent.clerkId, { childLinked: false });
    redirect("/parent-portal");
  }

  const data = (parent.onboardingData as OnboardingData | null) ?? {};
  const relationship = data.parentProfile?.relationship ?? "parent";

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
