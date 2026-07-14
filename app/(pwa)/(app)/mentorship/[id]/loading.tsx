import { Skeleton } from "@/components/skeleton";

// The chat is the one route that is not a max-w-2xl card stack: it's a header,
// a scrolling bubble list, and a composer pinned above the bottom nav. This
// mirrors page.tsx's frame exactly — same h-screen, same `fixed bottom-16`
// composer, same pb-24 on the list — so nothing moves when the real thread
// swaps in. An approximate skeleton here would just relocate the layout shift.
export default function Loading() {
  // Alternating incoming/outgoing bubbles of varied width, so the placeholder
  // reads as a conversation rather than a block of grey.
  const bubbles = [
    { key: "a", mine: false, w: "w-2/3" },
    { key: "b", mine: true, w: "w-1/2" },
    { key: "c", mine: false, w: "w-3/5" },
    { key: "d", mine: true, w: "w-2/5" },
    { key: "e", mine: false, w: "w-1/2" },
  ];

  return (
    <div aria-busy="true" className="flex h-screen flex-col bg-background">
      <output className="sr-only">Loading conversation…</output>

      {/* Peer header — mirrors the real header's px-4 py-3 row. */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="ml-auto h-7 w-16 rounded-full" />
      </div>

      {/* Message bubbles */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          {bubbles.map((b) => (
            <div
              key={b.key}
              className={b.mine ? "flex justify-end" : "flex justify-start"}
            >
              <Skeleton className={`h-12 rounded-2xl ${b.w}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Composer — fixed above the bottom nav, exactly as in page.tsx. */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="size-10 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}
