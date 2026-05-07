import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/db-user";
import { AppNav } from "@/components/app-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateDbUser();
  if (!user.interestTags || user.interestTags.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {children}
      <AppNav />
      <PwaInstallPrompt />
    </div>
  );
}
