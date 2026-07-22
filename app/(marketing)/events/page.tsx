import { EventCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { SectionHeading } from "@/components/marketing/section-heading";
import { getPastPublicEvents, getUpcomingPublicEvents } from "@/lib/cms";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events · Ikigai",
  description: "Upcoming and past Ikigai events across Sierra Leone.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingPublicEvents(),
    getPastPublicEvents(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Events
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Come and be part of it.
            </h1>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading title="Upcoming events" />
            {upcoming.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Nothing scheduled right now — check back soon.
              </p>
            )}
          </div>
        </section>

        {past.length > 0 && (
          <section className="bg-secondary py-24">
            <div className="mx-auto max-w-7xl px-6">
              <SectionHeading title="Past events" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
