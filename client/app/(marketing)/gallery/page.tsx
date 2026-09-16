import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getGalleryAlbums } from "@/lib/cms";
import { GalleryGrid } from "./gallery-grid";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gallery · Ikigai",
  description: "Photos from Ikigai's programmes, campaigns and events.",
};

export default async function GalleryPage() {
  const albums = await getGalleryAlbums();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Gallery
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Moments from our work.
            </h1>
          </div>
        </section>

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
