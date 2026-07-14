import { PageSkeleton, Skeleton, SkeletonText } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Journal" message="Loading your journal…">
      {/* Composer */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-3 flex justify-end">
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Past entries */}
      <div className="space-y-3">
        {["e1", "e2", "e3"].map((e) => (
          <div key={e} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-2.5 w-24" />
            <SkeletonText lines={3} className="mt-3" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
