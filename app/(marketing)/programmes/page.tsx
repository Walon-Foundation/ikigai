import { ProgrammeCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getPillars, getProgrammes } from "@/lib/cms";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Programmes · Ikigai",
  description: "Every programme Ikigai runs for young people in Sierra Leone.",
};

export default async function ProgrammesPage() {
  const [programmes, pillars] = await Promise.all([
    getProgrammes(),
    getPillars(),
  ]);
  const pillarName = new Map(pillars.map((p) => [p.id, p.name]));

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Programmes
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Everything we run.
            </h1>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            {programmes.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {programmes.map((p) => (
                  <ProgrammeCard
                    key={p.id}
                    programme={p}
                    pillarName={p.pillarId ? pillarName.get(p.pillarId) : null}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Programmes will appear here soon.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
