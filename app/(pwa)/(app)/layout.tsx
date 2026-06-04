import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { LiteModeInit } from "@/components/lite-mode-init";
import { PwaGate } from "@/components/pwa-gate";
import { getOrCreateDbUser } from "@/lib/db-user";

type OnboardingData = {
  roleSelected?: boolean;
  purposeProfile?: unknown;
  verificationSubmitted?: boolean;
  childLinked?: boolean;
  inviteCode?: string;
};

function getMenteeNextStep(data: OnboardingData): string {
  if (!data.roleSelected) return "/onboarding";
  const d = data as Record<string, unknown>;
  if (!d.assessment) return "/onboarding/mentee/assessment";
  if (!d.valuesRanking) return "/onboarding/mentee/values";
  if (!d.personality) return "/onboarding/mentee/personality";
  return "/onboarding/mentee/profile";
}

function getMentorNextStep(data: OnboardingData): string {
  if (!data.roleSelected) return "/onboarding";
  const d = data as Record<string, unknown>;
  if (!d.mentorProfile) return "/onboarding/mentor/profile";
  if (!d.mentorPricing) return "/onboarding/mentor/pricing";
  return "/onboarding/mentor/verification";
}

function getParentNextStep(data: OnboardingData): string {
  if (!data.roleSelected) return "/onboarding";
  const d = data as Record<string, unknown>;
  if (!d.parentProfile) return "/onboarding/parent/profile";
  return "/onboarding/parent/link";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateDbUser();
  const data = (user.onboardingData as OnboardingData | null) ?? {};

  // Resume logic: redirect to the correct onboarding step if not complete.
  // Role-specific route guards (e.g. mentor-portal requires mentor role) live
  // in each individual page — Next.js server layouts cannot read pathname.
  if (user.role === "mentee" || user.role === "club_lead" || !user.role) {
    if (!data.purposeProfile) {
      redirect(getMenteeNextStep(data));
    }
  } else if (user.role === "mentor") {
    if (!data.verificationSubmitted) {
      redirect(getMentorNextStep(data));
    }
  } else if (user.role === "parent") {
    if (!data.childLinked && !data.inviteCode) {
      redirect(getParentNextStep(data));
    }
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <LiteModeInit />
      <PwaGate />
      <AppSidebar role={user.role} displayName={user.displayName} />
      <div className="min-w-0 flex-1 pb-16 lg:overflow-y-auto lg:pb-0">
        {children}
      </div>
      <AppNav role={user.role} />
    </div>
  );
}
