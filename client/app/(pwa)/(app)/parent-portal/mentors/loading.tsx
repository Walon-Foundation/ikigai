import { PageSkeleton, SkeletonList } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton title="Mentors" message="Loading mentor information…">
      <SkeletonList count={3} />
    </PageSkeleton>
  );
}
