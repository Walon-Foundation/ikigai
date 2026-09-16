import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageBlocks } from "@/components/marketing/page-blocks";
import { getMarketingPage } from "@/lib/cms";

// Renders a page an admin created from /admin/pages — content that wasn't
// part of the original site design and has no dedicated route file. A single
// dynamic segment, not a route the site ships with: Next resolves the real
// folders (about/, contact/, etc.) before ever reaching this file, so a
// custom slug can never shadow a built-in page. Its sections are the exact
// same block system the homepage uses — see components/marketing/page-blocks.tsx
// and app/admin/(protected)/pages/actions.ts's reserved-slug check, which
// stops a custom page from claiming a built-in page's route or the "home"
// page_blocks key in the first place.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getMarketingPage(slug);
  if (!page) return { title: "Ikigai" };
  return {
    title: `${page.title} · Ikigai`,
    description: page.metaDescription ?? undefined,
  };
}

export default async function CustomMarketingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getMarketingPage(slug);
  if (!page) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <PageBlocks page={slug} />
      </main>
      <Footer />
    </div>
  );
}
