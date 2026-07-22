import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getPublicEvent } from "@/lib/cms";
import { clientEnv } from "@/lib/env.client";

// Rendered per request so making an event public or adding its report is live
// immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return { title: event ? `${event.title} · Ikigai` : "Event · Ikigai" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const isPast = event.startsAt ? event.startsAt.getTime() < Date.now() : false;
  const dateLabel = event.startsAt
    ? event.startsAt.toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-4xl px-6">
            <Link
              href="/events"
              className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-primary-muted hover:text-primary-foreground"
            >
              ← All events
            </Link>
            <h1 className="font-display text-4xl font-black leading-[1.1] text-primary-foreground sm:text-5xl">
              {event.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-6 text-primary-muted">
              {dateLabel && (
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {dateLabel}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </section>

        {event.imageUrl && (
          <div className="relative mx-auto -mt-8 aspect-[21/9] max-w-5xl overflow-hidden rounded-2xl px-6">
            <Image
              src={event.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="rounded-2xl object-cover"
              priority
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-6 py-20">
          {event.description && (
            <p className="mb-10 whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          )}

          {/* Post-event report */}
          {isPast && event.reportSummary ? (
            <div className="rounded-2xl border border-border bg-secondary p-8">
              <h2 className="font-display mb-4 text-2xl font-bold text-foreground">
                How it went
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {event.reportSummary}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {event.reportImpact && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Impact
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {event.reportImpact}
                    </p>
                  </div>
                )}
                {event.reportPartners && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Partners
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {event.reportPartners}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : !isPast ? (
            <div className="text-center">
              <a
                href={clientEnv.appUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Register in the app
              </a>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
