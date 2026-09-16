import { AdminPageSkeleton, AdminRows } from "@/components/admin-skeleton";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Push Notifications">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-6 h-12 w-full rounded-xl" />
          <Skeleton className="mt-4 h-28 w-full rounded-xl" />
          <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        </div>
        <AdminRows rows={4} />
      </div>
    </AdminPageSkeleton>
  );
}
