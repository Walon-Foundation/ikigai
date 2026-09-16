import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Goals" message="Loading your goals…">
      <Skeleton className="mb-4 h-11 w-full rounded-xl" />
      <div className="space-y-3">
        {["g1", "g2", "g3", "g4"].map((g) => (
          <div
            key={g}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="size-5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
