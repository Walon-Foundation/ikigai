import { AdminPageSkeleton, AdminRows } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Safeguarding Alerts">
      <AdminRows rows={6} />
    </AdminPageSkeleton>
  );
}
