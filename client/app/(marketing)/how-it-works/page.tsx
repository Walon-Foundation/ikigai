import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/seo";
import { StepItem } from "./step-item";
import { STEPS } from "./steps";

export const metadata = pageMetadata({
  title: "How It Works",
  description:
    "How Ikigai works — from self-discovery and Ikigai assessment to mentor matching, growth roadmap, and community impact.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        {/* Page header */}
        <PageHero
          eyebrow="The platform"
          title="How Ikigai works"
          lede="A structured, accountable journey from self-discovery to community impact."
        />

        {/* Steps */}
        <section className="mx-auto max-w-4xl px-6 pb-8">
          {STEPS.map((step, i) => (
            <StepItem key={step.num} step={step} index={i} />
          ))}
        </section>

        <InstallCta
          headline="Start your journey today."
          body="Join hundreds of young people across Sierra Leone who are already discovering their ikigai."
        />
      </main>
      <Footer />
    </div>
  );
}
