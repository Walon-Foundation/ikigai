"use client";

import { useClerk } from "@clerk/nextjs";
import { ShieldX } from "lucide-react";

export default function AdminUnauthorizedPage() {
  const { signOut } = useClerk();
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000";

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="size-7 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-black text-foreground">
          Not authorized
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed in, but this account doesn't have administrator access.
          If you manage Ikigai, sign in with your admin account.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
          >
            Sign out & switch account
          </button>
          <a
            href={marketingUrl}
            className="w-full rounded-full border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}
