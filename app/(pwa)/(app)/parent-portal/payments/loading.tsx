import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Payments" message="Loading payments…">
      <div className="mb-5 space-y-3">
        {["p1", "p2"].map((p) => (
          <div key={p} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
            <Skeleton className="mt-4 h-7 w-24" />
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="mb-3 h-3 w-28" />
      <div className="space-y-2">
        {["h1", "h2", "h3"].map((h) => (
          <div
            key={h}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
