import { AdminKpiGrid, AdminPageSkeleton } from "@/components/admin-skeleton";

// Fourteen aggregate queries behind this one.
export default function Loading() {
  return (
    <AdminPageSkeleton title="Analytics">
      <AdminKpiGrid
        count={6}
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      />
      <AdminKpiGrid
        count={3}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
      />
    </AdminPageSkeleton>
  );
}
