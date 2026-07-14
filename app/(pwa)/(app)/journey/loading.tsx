import { PageSkeleton, Skeleton, SkeletonText } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Journey" message="Growing your tree…">
      <div className="mb-5 rounded-2xl border border-border bg-card p-6">
        <Skeleton className="mx-auto size-40 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-28" />
        <Skeleton className="mx-auto mt-2 h-3 w-36" />
      </div>

      {/* Roadmap steps */}
      <div className="space-y-3">
        {["step-1", "step-2", "step-3", "step-4"].map((step) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <SkeletonText lines={1} />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
