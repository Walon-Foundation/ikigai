import { EventCard } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
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
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero eyebrow="Events" title="Come and be part of it." />

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
