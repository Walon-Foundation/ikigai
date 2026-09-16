import {
  BackLinkSkeleton,
  PageSkeleton,
  Skeleton,
  SkeletonText,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton message="Loading your shared plan…">
      <BackLinkSkeleton />
      {/* Peer header */}
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>

      {/* Shared milestones track */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-28" />
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <SkeletonText lines={4} className="mt-4" />
      </div>
    </PageSkeleton>
  );
}
