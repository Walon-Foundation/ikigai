import { ProgrammeCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getPillarsWithProgrammes } from "@/lib/cms";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "What We Do · Ikigai",
  description:
    "Ikigai's programmes across four pillars: Discover, Thrive, Build and Lead.",
};

export default async function WhatWeDoPage() {
  const pillars = await getPillarsWithProgrammes();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              What we do
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Four pillars, one mission.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-muted">
              Every programme we run sits under one of four pillars — together
              they take a young person from discovering who they are to leading
              change in their community.
            </p>
          </div>
        </section>

        {pillars.map((pillar) => (
          <section
            key={pillar.id}
            className="border-b border-border py-20 last:border-0"
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-10 max-w-2xl">
                <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
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
