import { AdminPageSkeleton, AdminRows } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Guardian Links">
      <AdminRows rows={6} />
    </AdminPageSkeleton>
  );
}
