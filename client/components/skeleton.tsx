import { cn } from "@/lib/utils";

// Loading placeholders. These exist to make navigation feel instant: a route's
// loading.tsx paints one of these immediately while the server renders the real
// page, so the user always sees the app respond to their tap.
//
// The shapes below deliberately mirror the real components they stand in for
// (same sizes, same spacing) — a skeleton that doesn't match its content just
// trades a blank screen for a layout shift.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      // aria-hidden: a screen reader should hear the page's loading status from
      // the live region in PageSkeleton, not read out every grey box.
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

// A block of fake paragraph lines. The last line is short, like real text.
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder list with no identity or reordering
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

// Stands in for the inline "← Back" link that detail pages open with, in place
// of a sticky header.
export function BackLinkSkeleton() {
  return <Skeleton className="mb-4 h-4 w-24" />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-5", className)}
    >
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
          <SkeletonText lines={2} className="pt-1" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder list with no identity or reordering
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// The full-page frame every loading.tsx uses. It announces the load politely to
// assistive tech, which otherwise gets no signal that a navigation is underway.
//
// `title` mirrors the sticky mobile PageHeader, and must be passed only by
// routes that actually render one. Detail routes (a mentee, an activity, a
// group thread) have no PageHeader — they open with an inline back-link — so
// giving them a title here would paint a 56px bar that then disappears when the
// real page arrives, jumping every piece of content up the screen. Omit the
// title for those and use <BackLinkSkeleton> instead.
export function PageSkeleton({
  title,
  message = "Loading…",
  children,
}: {
  title?: string;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {title && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <h1 className="font-display text-xl font-black text-foreground">
              {title}
            </h1>
            <Skeleton className="size-6 rounded-full" />
          </div>
        </header>
      )}
      <div aria-busy="true" className="mx-auto max-w-2xl px-4 py-6">
        {/* <output> is the semantic status region: it carries an implicit
            role="status" and aria-live="polite", so a screen reader announces
            what is loading without us hand-rolling ARIA on a div. */}
        <output className="sr-only">{message}</output>
        {children}
      </div>
    </>
  );
}
