import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { getGalleryAlbums } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { GalleryGrid } from "./gallery-grid";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Gallery",
  description: "Photos from Ikigai's programmes, campaigns and events.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const albums = await getGalleryAlbums();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero eyebrow="Gallery" title="Moments from our work." />

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            {albums.length > 0 ? (
              <GalleryGrid albums={albums} />
            ) : (
              <p className="text-center text-muted-foreground">
                Photos coming soon.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
