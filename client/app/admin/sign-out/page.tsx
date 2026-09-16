"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import { signOutAndClearOfflineJournal } from "@/lib/offline-journal";

export default function AdminSignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    // Clears the offline journal queue first: this app is used on shared
    // devices, and a queued entry outliving its author's session is both a
    // disclosure and a mis-attribution risk. See lib/offline-journal.ts.
    signOutAndClearOfflineJournal(signOut, { redirectUrl: "/admin/sign-in" });
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Signing out…</p>
    </div>
  );
}
