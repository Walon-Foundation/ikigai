import { Skeleton } from "@/components/skeleton";

// The chat is the one route that is not a max-w-2xl card stack: it's a fixed
// header, a scrolling bubble list and a composer pinned to the bottom. The
// skeleton reproduces that frame so the composer doesn't jump into place.
export default function Loading() {
  // Alternating incoming/outgoing bubbles of varied width, so the placeholder
  // reads as a conversation rather than a block of grey.
  const bubbles = [
    { mine: false, w: "w-2/3" },
    { mine: true, w: "w-1/2" },
    { mine: false, w: "w-3/5" },
    { mine: true, w: "w-2/5" },
    { mine: false, w: "w-1/2" },
  ];

  return (
    <div aria-busy="true" className="flex h-[100dvh] flex-col">
      <output className="sr-only">Loading conversation…</output>

      {/* Peer header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </header>

      {/* Message bubbles */}
      <div className="flex-1 space-y-3 overflow-hidden p-4">
        {bubbles.map((b) => (
          <div
            key={`${b.mine}-${b.w}`}
            className={b.mine ? "flex justify-end" : "flex justify-start"}
          >
            <Skeleton className={`h-10 rounded-2xl ${b.w}`} />
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
