import { AdminPageSkeleton, AdminRows } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Users">
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "mentee", "mentor", "parent"].map((f) => (
          <div
            key={f}
            className="h-8 w-20 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
      <AdminRows rows={8} />
    </AdminPageSkeleton>
  );
}
