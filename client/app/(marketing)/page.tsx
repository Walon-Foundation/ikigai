import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageBlocks } from "@/components/marketing/page-blocks";
import { JsonLd } from "@/components/system/json-ld";
import { ORGANIZATION, pageMetadata, SITE } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Ikigai — Find your reason to wake up every morning",
  description:
    "A youth-led organization helping young people in Sierra Leone discover purpose, build skills, and lead change, with verified mentors and a community built for their future.",
  path: "/",
  absoluteTitle: true,
});

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
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            ORGANIZATION,
            {
              "@type": "WebSite",
              "@id": `${SITE.url}/#website`,
              name: SITE.name,
              url: SITE.url,
              inLanguage: "en",
              publisher: { "@id": ORGANIZATION["@id"] },
            },
          ],
        }}
      />
      <Nav />
      <main>
        <PageBlocks page="home" />
      </main>
      <Footer />
    </div>
  );
}
