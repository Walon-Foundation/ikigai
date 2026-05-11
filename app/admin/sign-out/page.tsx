"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function AdminSignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: "/admin/sign-in" });
  }, [signOut]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Signing out…</p>
    </div>
  );
}
