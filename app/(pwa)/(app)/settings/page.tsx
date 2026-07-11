import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/db-user";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  return (
    <SettingsClient
      user={{
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        growthLevel: user.growthLevel,
        interestTags: user.interestTags,
        pushEnabled: !!user.pushSubscription,
      }}
    />
  );
}
