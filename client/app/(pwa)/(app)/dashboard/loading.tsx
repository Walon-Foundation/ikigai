import { PageSkeleton, Skeleton, SkeletonText } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Home" message="Loading your dashboard…">
      {/* Growth tree / hero card */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6">
        <Skeleton className="mx-auto size-32 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-32" />
        <Skeleton className="mx-auto mt-2 h-3 w-24" />
      </div>

      {/* Active mentorship card */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      {/* Open tasks */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-20" />
        <SkeletonText lines={3} className="mt-3" />
      </div>
    </PageSkeleton>
  );
}
