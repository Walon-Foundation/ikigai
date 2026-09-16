import { PageSkeleton, Skeleton, SkeletonText } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Purpose Book" message="Opening your purpose book…">
      <div className="mb-5 rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-3 w-32" />
        <SkeletonText lines={4} className="mt-4" />
      </div>
      <div className="space-y-3">
        {["s1", "s2", "s3"].map((s) => (
          <div key={s} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-3.5 w-1/3" />
            <SkeletonText lines={2} className="mt-3" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
