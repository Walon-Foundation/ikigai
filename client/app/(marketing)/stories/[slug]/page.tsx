import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getStory } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

const CATEGORY_LABEL: Record<string, string> = {
  participant: "Participant story",
  volunteer: "Volunteer story",
  partner: "Partner story",
  impact: "Impact story",
};

// Rendered per request so publishing or editing a story is live immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "Story not found" };
  return pageMetadata({
    title: story.title,
    description: story.excerpt,
    path: `/stories/${slug}`,
    type: "article",
  });
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <article className="mx-auto max-w-3xl px-6 pb-24 pt-40">
          <Link
            href="/stories"
            className="mb-6 inline-block text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            ← All stories
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--w-orange-ink)">
            {CATEGORY_LABEL[story.category] ?? story.category}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-(--w-green-deep) sm:text-5xl">
            {story.title}
          </h1>
          {story.authorName && (
            <p className="mt-4 text-sm text-muted-foreground">
              By {story.authorName}
            </p>
          )}

          {story.coverImageUrl && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-secondary">
              <Image
                src={story.coverImageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {story.excerpt && (
            <p className="mt-8 text-xl leading-relaxed text-foreground">
              {story.excerpt}
            </p>
          )}
          {story.body && (
            <div className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
              {story.body}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
