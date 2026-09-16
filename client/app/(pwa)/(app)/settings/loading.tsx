import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Settings" message="Loading your settings…">
      {/* Profile card */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      {/* Toggle rows */}
      <div className="space-y-2">
        {["t1", "t2", "t3"].map((t) => (
          <div
            key={t}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-48" />
            </div>
            <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
