import { PageSkeleton, Skeleton, SkeletonText } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="My Child" message="Loading your child's progress…">
      {/* Child + growth tree */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6">
        <Skeleton className="mx-auto size-28 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-32" />
        <Skeleton className="mx-auto mt-2 h-3 w-24" />
      </div>

      {/* Progress + attendance stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-7 w-12" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-12" />
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-24" />
        <SkeletonText lines={3} className="mt-3" />
      </div>
    </PageSkeleton>
  );
}
