"use client";

import dynamic from "next/dynamic";

const ResourceMap = dynamic(() => import("@/components/resource-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function ResourceMapClient() {
  return <ResourceMap />;
}
