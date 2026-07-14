import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Group" message="Loading the discussion…">
      <div className="mb-4 space-y-3">
        {["m1", "m2", "m3", "m4"].map((m) => (
          <div key={m} className="flex items-start gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
    </PageSkeleton>
  );
}
