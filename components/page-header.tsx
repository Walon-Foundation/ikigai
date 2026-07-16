import { Greeting } from "@/components/greeting";
import { NotificationBell } from "@/components/notifications";

interface PageHeaderProps {
  title?: string;
  showGreeting?: boolean;
}

// The header on every PWA screen.
//
// This is a server component. It used to be `"use client"` and call Clerk's
// useUser() at the top — which meant every one of the ~14 pages that renders
// `<PageHeader title="…" />` paid for a Clerk client-context subscription, plus
// the re-renders that come with it, to compute a first name that only the
// dashboard ever displays. The two genuinely interactive pieces are islands of
// their own: the bell, and the greeting.
export function PageHeader({ title, showGreeting = false }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div>
          {showGreeting ? (
            <Greeting />
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
