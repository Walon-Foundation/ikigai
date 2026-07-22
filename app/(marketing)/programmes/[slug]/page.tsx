import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getProgramme } from "@/lib/cms";

// Rendered per request so an edit to a programme's copy or photos is live
// immediately, rather than frozen into build-time HTML.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programme = await getProgramme(slug);
  if (!programme) return { title: "Programme · Ikigai" };
  return {
    title: `${programme.name} · Ikigai`,
    description: programme.summary ?? undefined,
  };
}

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programme = await getProgramme(slug);
  if (!programme) notFound();

  const ctaHref = programme.ctaUrl || "/get-involved";
  const ctaLabel = programme.ctaLabel || "Join this programme";

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Header */}
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-4xl px-6">
            {programme.pillar && (
              <Link
                href="/what-we-do"
                className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-primary-muted hover:text-primary-foreground"
              >
                {programme.pillar.icon} {programme.pillar.name}
              </Link>
            )}
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              {programme.name}
            </h1>
            {programme.summary && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-muted">
                {programme.summary}
              </p>
            )}
          </div>
        </section>

        {/* Hero image */}
        {programme.heroImageUrl && (
          <div className="relative mx-auto -mt-8 aspect-[21/9] max-w-5xl overflow-hidden rounded-2xl px-6">
            <Image
              src={programme.heroImageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="rounded-2xl object-cover"
              priority
            />
          </div>
        )}

        <div className="mx-auto max-w-4xl px-6 py-20">
          {/* About */}
          {programme.about && (
            <div className="mb-16">
              <h2 className="font-display mb-4 text-2xl font-bold text-foreground">
                About this programme
              </h2>
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
                {programme.about}
              </p>
            </div>
          )}

          <div className="grid gap-12 sm:grid-cols-2">
            {/* Objectives */}
            {programme.objectives.length > 0 && (
              <div>
                <h2 className="font-display mb-4 text-xl font-bold text-foreground">
                  What you gain
                </h2>
                <ul className="space-y-3">
                  {programme.objectives.map((o) => (
                    <li key={o} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Activities */}
            {programme.activities.length > 0 && (
              <div>
                <h2 className="font-display mb-4 text-xl font-bold text-foreground">
                  What happens
                </h2>
                <ul className="space-y-3">
                  {programme.activities.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      <span className="text-muted-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Impact */}
          {programme.impactValue && (
            <div className="mt-16 rounded-2xl border border-border bg-secondary p-8 text-center">
              <div className="font-display text-5xl font-black text-primary">
                {programme.impactValue}
              </div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {programme.impactLabel}
              </div>
            </div>
          )}

          {/* Gallery */}
          {programme.photos.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display mb-4 text-xl font-bold text-foreground">
                Gallery
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {programme.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-xl bg-secondary"
                  >
                    <Image
                      src={photo.imageUrl}
                      alt={photo.caption ?? ""}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {ctaLabel} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
