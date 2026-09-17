import { ProgrammeCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { getPillarsWithProgrammes } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "What We Do",
  description:
    "Ikigai's programmes across four pillars: Discover, Thrive, Build and Lead.",
  path: "/what-we-do",
});

export default async function WhatWeDoPage() {
  const pillars = await getPillarsWithProgrammes();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero
          eyebrow="What we do"
          title="Four pillars, one mission."
          lede="Every programme we run sits under one of four pillars — together they take a young person from discovering who they are to leading change in their community."
        />

        {pillars.map((pillar) => (
          <section
            key={pillar.id}
            className="border-b border-border py-20 last:border-0"
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-10 max-w-2xl">
                <h2 className="font-display text-3xl font-semibold text-(--w-green-deep) sm:text-4xl">
                  <span aria-hidden className="mr-2">
                    {pillar.icon}
                  </span>
                  {pillar.name}
                </h2>
                {pillar.description && (
                  <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                )}
              </div>

              {pillar.programmes.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {pillar.programmes.map((p) => (
                    <ProgrammeCard key={p.id} programme={p} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Programmes coming soon.
                </p>
              )}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
