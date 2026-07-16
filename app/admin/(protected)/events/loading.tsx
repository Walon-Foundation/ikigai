import { AdminPageSkeleton, AdminRows } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Events">
      <AdminRows rows={5} />
    </AdminPageSkeleton>
  );
}
