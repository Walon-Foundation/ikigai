import { AdminPageSkeleton, AdminSection } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Safety Reports">
      <AdminSection title="Open Reports" rows={3} />
      <AdminSection title="Resolved" rows={4} />
    </AdminPageSkeleton>
  );
}
