import { PageSkeleton, Skeleton, SkeletonList } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Find a Mentor" message="Finding mentors for you…">
      {/* Search box */}
      <Skeleton className="mb-4 h-12 w-full rounded-xl" />

      {/* Industry filter chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-12 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <SkeletonList count={4} />
    </PageSkeleton>
  );
}
