import { PageSkeleton, Skeleton, SkeletonList } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Groups" message="Loading groups…">
      <Skeleton className="mb-4 h-11 w-full rounded-xl" />
      <SkeletonList count={4} />
    </PageSkeleton>
  );
}
