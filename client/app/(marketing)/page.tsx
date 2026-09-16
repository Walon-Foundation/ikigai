import type { Metadata } from "next";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageBlocks } from "@/components/marketing/page-blocks";

export const metadata: Metadata = {
  title: "Ikigai — Find your reason to wake up every morning",
  description:
    "A purpose-discovery and mentorship platform for youth in Sierra Leone. Discover purpose, be matched with verified mentors, and grow with your community.",
  openGraph: {
    title: "Ikigai — Find your reason to wake up every morning",
    description:
      "A purpose-discovery and mentorship platform for youth in Sierra Leone.",
  },
};

// The public organisation homepage. Every section is a block from
// lib/blocks/registry.ts, ordered and configured at /admin/page-builder — see
// components/marketing/page-blocks.tsx. This is the first page migrated onto
// the block system; the other marketing pages still render their sections
// directly and are explicitly out of scope for this pass.

// Server-rendered per request so admin edits (both page-builder reordering and
// the underlying CMS lists each block draws from) appear immediately; see
// lib/cms.ts.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <PageBlocks page="home" />
      </main>
      <Footer />
    </div>
  );
}
