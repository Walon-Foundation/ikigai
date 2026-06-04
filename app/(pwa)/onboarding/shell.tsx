"use client";

import { usePathname } from "next/navigation";

const STEP_MAP: Record<string, { current: number; total: number }> = {
  "/onboarding/mentee/assessment": { current: 1, total: 4 },
  "/onboarding/mentee/values": { current: 2, total: 4 },
  "/onboarding/mentee/personality": { current: 3, total: 4 },
  "/onboarding/mentee/profile": { current: 4, total: 4 },
  "/onboarding/mentor/profile": { current: 1, total: 3 },
  "/onboarding/mentor/pricing": { current: 2, total: 3 },
  "/onboarding/mentor/verification": { current: 3, total: 3 },
  "/onboarding/parent/profile": { current: 1, total: 2 },
  "/onboarding/parent/link": { current: 2, total: 2 },
};

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = STEP_MAP[pathname];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-black text-primary">
              Ikigai
            </span>
            {step && (
              <span className="text-sm text-muted-foreground">
                Step {step.current} of {step.total}
              </span>
            )}
          </div>
          {step && (
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(step.current / step.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-6 py-10">{children}</div>
    </div>
  );
}
