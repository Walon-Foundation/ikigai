"use client";

import { useLinkStatus } from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// Navigation feedback. `loading.tsx` skeletons are the main signal that a tap
// registered, but they only appear once the router commits — on a slow network
// there is still a gap between the tap and that commit. This fills the gap:
// a top progress bar plus a dot on the nav item you actually pressed, both
// driven by Next's useLinkStatus.
//
// useLinkStatus only works inside a <Link>, so a link reports its own pending
// state up to this provider, which owns the app-wide bar.

type NavProgressContext = {
  start: () => void;
  stop: () => void;
};

const Ctx = createContext<NavProgressContext | null>(null);

export function NavProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // A count, not a boolean: React may keep an outgoing link's pending state
  // alive for a tick while a new one starts, and a boolean would flicker off.
  const [pending, setPending] = useState(0);

  const value = useMemo<NavProgressContext>(
    () => ({
      start: () => setPending((n) => n + 1),
      stop: () => setPending((n) => Math.max(0, n - 1)),
    }),
    [],
  );

  return (
    <Ctx.Provider value={value}>
      <div
        role="progressbar"
        aria-hidden={pending === 0}
        aria-label="Loading page"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 transition-opacity duration-200",
          pending > 0 ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Indeterminate: we can't know real progress, so the bar advances
            quickly then eases, which reads as "working" without ever lying
            about being nearly done. */}
        {pending > 0 && (
          <div className="h-full w-full origin-left animate-nav-progress bg-primary" />
        )}
      </div>
      {children}
    </Ctx.Provider>
  );
}

// Drop inside a <Link> to register that link's navigation with the bar above.
// Renders a fixed-size dot that fades in — never a layout shift, per the
// useLinkStatus guidance.
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  const ctx = useContext(Ctx);
  const start = ctx?.start;
  const stop = ctx?.stop;

  // Hold a registration with the provider for as long as this link is pending;
  // the cleanup releases it when the navigation lands or the link unmounts.
  useEffect(() => {
    if (!pending || !start || !stop) return;
    start();
    return stop;
  }, [pending, start, stop]);

  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto size-1.5 shrink-0 rounded-full bg-current transition-opacity duration-150",
        // Delay the fade-in so an already-prefetched, instant navigation
        // doesn't flash a dot the user never needed to see.
        pending ? "animate-pulse opacity-70 delay-100" : "opacity-0",
        className,
      )}
    />
  );
}
