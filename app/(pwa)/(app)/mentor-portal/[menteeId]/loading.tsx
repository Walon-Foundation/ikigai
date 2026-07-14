import {
  BackLinkSkeleton,
  PageSkeleton,
  Skeleton,
  SkeletonText,
} from "@/components/skeleton";

// The mentor's view of one mentee: peer header, shared milestones, the full
// Ikigai profile, then the curriculum builder. This is the heaviest page in the
// app, so a matched skeleton matters most here.
export default function Loading() {
  return (
    <PageSkeleton message="Loading this mentee's profile…">
      <BackLinkSkeleton />
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Shared milestones */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-28" />
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-1 flex-1 rounded-full" />
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-1 flex-1 rounded-full" />
          <Skeleton className="size-8 shrink-0 rounded-full" />
        </div>
      </div>

      {/* Ikigai quadrants */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-32" />
        <SkeletonText lines={2} className="mt-3" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["loves", "good-at", "needs", "paid-for"].map((quadrant) => (
            <div key={quadrant} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-full rounded-full" />
              <Skeleton className="h-6 w-4/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum builder */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <SkeletonText lines={4} className="mt-4" />
      </div>
    </PageSkeleton>
  );
}
