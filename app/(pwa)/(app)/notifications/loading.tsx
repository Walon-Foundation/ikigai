import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Notifications" message="Loading your notifications…">
      <div className="space-y-2">
        {["n1", "n2", "n3", "n4", "n5"].map((n) => (
          <div
            key={n}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
