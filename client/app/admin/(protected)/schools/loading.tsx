import { AdminPageSkeleton, AdminSection } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="School Vetting">
      <AdminSection title="Pending Review" rows={3} />
      <AdminSection title="Active Clubhouses" rows={4} />
    </AdminPageSkeleton>
  );
}
