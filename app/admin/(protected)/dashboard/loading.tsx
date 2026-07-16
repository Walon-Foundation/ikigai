import {
  AdminKpiGrid,
  AdminPageSkeleton,
  AdminRows,
} from "@/components/admin-skeleton";

// The heaviest read in the app — ten parallel counts, previously with no
// Suspense boundary at all, so the whole screen just hung.
export default function Loading() {
  return (
    <AdminPageSkeleton title="Dashboard">
      <AdminKpiGrid count={6} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminRows rows={4} />
        <AdminRows rows={4} />
      </div>
    </AdminPageSkeleton>
  );
}
