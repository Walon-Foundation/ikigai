import { PageSkeleton, Skeleton, SkeletonList } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Match" message="Loading your match…">
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-xl" />
      </div>
      <Skeleton className="mb-3 h-3 w-32" />
      <SkeletonList count={3} />
    </PageSkeleton>
  );
}
