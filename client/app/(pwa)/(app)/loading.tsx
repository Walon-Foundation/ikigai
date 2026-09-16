import { PageSkeleton, Skeleton, SkeletonList } from "@/components/skeleton";

// Catch-all fallback for any segment under (app) without its own loading.tsx.
// Routes with a distinctive shape define a closer, better-matched skeleton.
export default function Loading() {
  return (
    <PageSkeleton title="Ikigai">
      <Skeleton className="mb-5 h-8 w-40" />
      <SkeletonList count={3} />
    </PageSkeleton>
  );
}
