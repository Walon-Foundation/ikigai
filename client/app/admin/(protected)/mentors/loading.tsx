import { AdminPageSkeleton, AdminSection } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton title="Mentor Verification">
      <AdminSection title="Pending Verification" rows={3} />
      <AdminSection title="Verified Mentors" rows={5} />
    </AdminPageSkeleton>
  );
}
