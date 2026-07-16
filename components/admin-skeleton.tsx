import { Skeleton } from "@/components/skeleton";

// Loading frames for the admin surface.
//
// Admin had no loading.tsx at all while the PWA had 22, so every admin
// navigation froze on the previous screen until the queries came back — and
// these are the heaviest reads in the app (the dashboard fires ten, analytics
// fourteen). The work wasn't just slow, it was invisible.
//
// The page title is passed through as REAL text rather than a shimmering bar:
// it's static, it's known before the data loads, and painting it immediately is
// both faster-feeling and honest. Only the parts that genuinely depend on the
// database shimmer. The header markup below must stay in step with the real
// pages (`div.mb-8 > h1 + p`) — a skeleton whose frame doesn't match the page
// it stands in for causes the very layout jump it exists to prevent.

export function AdminPageSkeleton({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : (
          <Skeleton className="mt-2 h-4 w-64" />
        )}
      </div>
      <div aria-busy="true">
        <output className="sr-only">Loading {title}…</output>
        {children}
      </div>
    </div>
  );
}

/** Row of stat tiles — dashboard and analytics both open with one. */
export function AdminKpiGrid({
  count = 6,
  className = "mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder list, never reordered
          key={i}
          className="rounded-xl border border-border bg-card p-5"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Stack of card rows — the queues and tables (users, mentors, reports…). */
export function AdminRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder list, never reordered
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** A titled section — "Pending Review", "Active", etc. */
export function AdminSection({
  title,
  rows = 3,
}: {
  title: string;
  rows?: number;
}) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          {title}
        </h2>
      </div>
      <AdminRows rows={rows} />
    </div>
  );
}

/** Detail screens (verify / vet / report) — back link, then a card. */
export function AdminDetailSkeleton({ backLabel }: { backLabel: string }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-6 text-sm text-muted-foreground">‹ {backLabel}</p>
      <Skeleton className="mb-6 h-9 w-56" />
      <div aria-busy="true">
        <output className="sr-only">Loading…</output>
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-52" />
            </div>
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1.5 h-4 w-3/4" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 flex-1 rounded-full" />
          <Skeleton className="h-14 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
