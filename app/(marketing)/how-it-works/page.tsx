import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { StepItem } from "./step-item";
import { STEPS } from "./steps";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Page header */}
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              The Platform
            </p>
            <h1 className="font-display mb-5 text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              How Ikigai Works
            </h1>
            <p className="text-xl leading-relaxed text-primary-muted">
              A structured, accountable journey from self-discovery to community
              impact.
            </p>
          </div>
        </section>

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
