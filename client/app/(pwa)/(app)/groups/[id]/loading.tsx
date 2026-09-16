import { Skeleton } from "@/components/skeleton";

// Not a PageSkeleton: the group thread has no sticky header (it opens with an
// inline back-link) and it is a full-height flex column with a composer pinned
// at the bottom, not a plain scrolling block. This mirrors page.tsx's frame so
// nothing shifts when the real thread arrives.
export default function Loading() {
  const posts = ["p1", "p2", "p3", "p4"];

  return (
    <div
      aria-busy="true"
      className="mx-auto flex h-[calc(100vh-1px)] max-w-2xl flex-col px-4 py-6 lg:h-screen"
    >
      <output className="sr-only">Loading the discussion…</output>

      {/* Inline back link */}
      <Skeleton className="mb-4 h-4 w-24" />

      {/* Group title */}
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-2 h-3 w-3/4" />

      {/* Posts */}
      <div className="mt-5 flex-1 space-y-4 overflow-hidden">
        {posts.map((p) => (
          <div key={p} className="flex items-start gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="mt-3 flex shrink-0 gap-2">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
