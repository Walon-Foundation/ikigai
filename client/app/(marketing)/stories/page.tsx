import Link from "next/link";
import { StoryCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getStories } from "@/lib/cms";

export const metadata = {
  title: "Stories · Ikigai",
  description:
    "Stories from the young people, volunteers and partners of Ikigai.",
};

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
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Stories
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Voices from Ikigai.
            </h1>
          </div>
        </section>

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
