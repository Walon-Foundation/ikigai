import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { AppSidebar } from "@/components/app-sidebar";
import { LiteModeInit } from "@/components/lite-mode-init";
import { NavProgressProvider } from "@/components/nav-progress";
import { NotificationsProvider } from "@/components/notifications";
import { ToastProvider } from "@/components/toast";
import { getOrCreateDbUser } from "@/lib/db-user";

type OnboardingData = {
  roleSelected?: boolean;
  purposeProfile?: unknown;
  verificationSubmitted?: boolean;
  childLinked?: boolean;
  inviteCode?: string;
  linkSkipped?: boolean;
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
    // `linkSkipped` is the third exit. Without it a parent who tapped
    // "Skip for now" on the link step was redirected back to that same step
    // forever: the skip recorded only `childLinked: false`, which this guard
    // reads as "not finished". The parent dashboard already renders a "No child
    // linked yet" state for exactly this case; it was simply unreachable.
    if (!data.childLinked && !data.inviteCode && !data.linkSkipped) {
      redirect(getParentNextStep(data));
    }
  }

  return (
    <ToastProvider>
      <NotificationsProvider>
        <NavProgressProvider>
          <div className="min-h-screen bg-background lg:flex">
            <LiteModeInit />
            <AppSidebar role={user.role} displayName={user.displayName} />
            <div className="min-w-0 flex-1 pb-16 lg:overflow-y-auto lg:pb-0">
              {children}
            </div>
            <AppNav role={user.role} />
          </div>
        </NavProgressProvider>
      </NotificationsProvider>
    </ToastProvider>
  );
}
