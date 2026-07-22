import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getPartners } from "@/lib/cms";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partners · Ikigai",
  description: "The organizations Ikigai works with to reach young people.",
};

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Partners
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              We do this together.
            </h1>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            {partners.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-6"
                  >
                    {p.logoUrl && (
                      <Image
                        src={p.logoUrl}
                        alt={p.name}
                        width={64}
                        height={64}
                        className="size-16 shrink-0 rounded-xl object-contain"
                      />
                    )}
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {p.websiteUrl ? (
                          <a
                            href={p.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                          >
                            {p.name}
                          </a>
                        ) : (
                          p.name
                        )}
                      </h3>
                      {p.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Partner organizations will appear here.
              </p>
            )}

            {/* Become a partner CTA */}
            <div className="mt-16 rounded-2xl bg-secondary p-10 text-center">
              <h2 className="font-display text-3xl font-black text-foreground">
                Become a partner
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Reach young people across Sierra Leone and help us grow the next
                generation of leaders.
              </p>
              <Link
                href="/get-involved#partner"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Partner with us <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
