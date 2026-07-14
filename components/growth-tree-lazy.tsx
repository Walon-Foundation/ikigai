"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/skeleton";

// The growth tree is the heaviest thing on the pages that show it: it is the
// app's only framer-motion dependency. Splitting it into its own chunk keeps
// that animation library out of the initial script the dashboard, journey and
// parent portal have to download and parse before they become interactive.
//
// SSR stays on (the default) — the tree is the emotional centrepiece of these
// pages and should be in the first paint, not popped in afterwards. What we
// defer is only the JavaScript that animates it.
export const GrowthTree = dynamic(
  () => import("@/components/growth-tree").then((m) => m.GrowthTree),
  {
    loading: () => <Skeleton className="mx-auto size-40 rounded-full" />,
  },
);
