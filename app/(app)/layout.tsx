import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { LiteModeInit } from "@/components/lite-mode-init";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { getOrCreateDbUser } from "@/lib/db-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateDbUser();
  if (!user.interestTags || user.interestTags.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <LiteModeInit />
      {/* Desktop sidebar — hidden on mobile */}
      <AppSidebar />
      {/* Content area */}
      <div className="flex-1 min-w-0 pb-16 lg:pb-0 lg:overflow-y-auto">
        {children}
      </div>
      {/* Mobile bottom nav — hidden on desktop */}
      <AppNav />
      <PwaInstallPrompt />
    </div>
  );
}
