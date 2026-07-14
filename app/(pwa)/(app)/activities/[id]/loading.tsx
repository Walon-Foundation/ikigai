import { PageSkeleton, Skeleton, SkeletonText } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Activity" message="Loading this activity…">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-2/3" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <SkeletonText lines={4} className="mt-5" />
        <Skeleton className="mt-6 h-11 w-full rounded-xl" />
      </div>
    </PageSkeleton>
  );
}
