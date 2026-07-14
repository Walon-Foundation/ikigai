import { PageSkeleton, Skeleton, SkeletonList } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="My Mentees" message="Loading your mentees…">
      <Skeleton className="mb-3 h-3 w-28" />
      <SkeletonList count={2} className="mb-6" />
      <Skeleton className="mb-3 h-3 w-24" />
      <SkeletonList count={3} />
    </PageSkeleton>
  );
}
