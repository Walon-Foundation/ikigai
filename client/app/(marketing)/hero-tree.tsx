"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// The growth tree in the marketing hero.
//
// The tree is the heaviest thing on this page by a wide margin: it is the only
// thing in the whole marketing surface that pulls in framer-motion, and
// together they were about 46KB gzipped. It sits in a `hidden lg:flex` panel,
// so no phone has ever displayed it — every visitor on a low-end Android
// downloaded it, parsed it, hydrated it and animated it, and then CSS hid it.
//
// `hidden lg:flex` alone doesn't help, and neither does next/dynamic on its
// own: a display:none element still MOUNTS, so the lazy chunk is still
// requested. The import has to be behind a condition that is false on a phone,
// which is what this component is. Below 1024px nothing renders and the chunk
// is never asked for.
const GrowthTree = dynamic(
  () => import("@/components/growth-tree").then((m) => m.GrowthTree),
  { ssr: false },
);

const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function HeroTree() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // The server can't know the viewport. Guessing "desktop" here would render
    // the tree into the HTML for phones too, which is the thing being avoided.
    () => false,
  );

  if (!isDesktop) return null;
  return <GrowthTree completedCount={6} level={3} />;
}
