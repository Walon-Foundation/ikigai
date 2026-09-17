import Link from "next/link";
import { StoryCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { getStories } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Stories",
  description:
    "Stories from the young people, volunteers and partners of Ikigai.",
  path: "/stories",
});

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "participant", label: "Participants" },
  { key: "volunteer", label: "Volunteers" },
  { key: "partner", label: "Partners" },
  { key: "impact", label: "Impact" },
];

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await getStories();
  const stories = category ? all.filter((s) => s.category === category) : all;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero eyebrow="Stories" title="Voices from Ikigai." />

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const href = c.key ? `/stories?category=${c.key}` : "/stories";
                const active = (category ?? "") === c.key;
                return (
                  <Link
                    key={c.key}
                    href={href}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>

            {stories.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No stories here yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
