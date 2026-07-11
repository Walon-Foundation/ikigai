"use client";

import { useUser } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notifications";

interface PageHeaderProps {
  title?: string;
  showGreeting?: boolean;
}

export function PageHeader({ title, showGreeting = false }: PageHeaderProps) {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div>
          {showGreeting ? (
            <>
              <p className="text-xs text-muted-foreground">{greeting}</p>
              <h1 className="font-display text-lg font-black text-foreground leading-tight">
                {firstName}
              </h1>
            </>
          ) : (
            <h1 className="font-display text-xl font-black text-foreground">
              {title}
            </h1>
          )}
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
