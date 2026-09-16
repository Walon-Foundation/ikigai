"use client";

import { useUser } from "@clerk/nextjs";

// The dashboard's "Good morning, Aminata".
//
// Split out of PageHeader so that Clerk's useUser() — and the client boundary
// it forces — is paid for on the one screen that shows a name, instead of on
// every screen in the app.
//
// The greeting is time-of-day dependent, so it has to be computed in the
// browser regardless: rendering it on the server would show the server's idea
// of the hour, which for a user in Freetown reading a page rendered in
// us-east-1 can be the wrong half of the day.
export function Greeting() {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <p className="text-xs text-muted-foreground">{greeting}</p>
      <h1 className="font-display text-lg font-black leading-tight text-foreground">
        {firstName}
      </h1>
    </>
  );
}
