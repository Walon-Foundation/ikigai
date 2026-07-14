import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Activities" message="Loading activities…">
      <div className="space-y-3">
        {["a1", "a2", "a3"].map((a) => (
          <div key={a} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
