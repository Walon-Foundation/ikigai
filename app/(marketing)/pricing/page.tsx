import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { SectionReveal } from "@/components/marketing/section-reveal";

const MENTEE_PLANS = [
  {
    name: "Scholarship",
    tag: "Sponsored Access",
    tagColor: "bg-primary/10 text-primary",
    accent: "border-primary",
    price: "Free",
    priceNote: "Fully sponsored",
    description:
      "For youth who cannot afford a paid plan. Sponsored by NGO partners, schools, and community organisations. Same full platform access — no one is left behind.",
    features: [
      "Full mentor matching",
      "Complete growth roadmap",
      "Private journal and progress tracking",
      "All platform features included",
    ],
    cta: "Apply in the app",
    highlight: false,
  },
  {
    name: "Monthly",
    tag: "Most Flexible",
    tagColor: "bg-accent/15 text-foreground",
    accent: "border-accent",
    price: "Subscription",
    priceNote: "Billed monthly",
    description:
      "A recurring monthly plan that keeps you connected with your mentor. Renew each month, pause anytime. Ideal for mentees who want ongoing, long-term guidance.",
    features: [
      "Unlimited mentorship sessions",
      "Full roadmap access",
      "Invoice history and reminders",
      "Switch mentors after icebreaker",
    ],
    cta: "Start in the app",
    highlight: true,
  },
  {
    name: "One-Time Package",
    tag: "Fixed Commitment",
    tagColor: "bg-earth/10 text-earth",
    accent: "border-earth",
    price: "Package",
    priceNote: "Fixed duration",
    description:
      "A defined mentorship period — typically 3 or 6 months. Pay once, access your mentor for the full duration. Best for mentees with a specific goal or milestone to reach.",
    features: [
      "Fixed-term mentorship access",
      "Structured milestone tracking",
      "Invoice generated on purchase",
      "Extend or renew at end of term",
    ],
    cta: "Choose in the app",
    highlight: false,
  },
] as const;

const PARTNER_PLANS = [
  {
    title: "School Partnership",
    accent: "border-primary",
    body: "Register your school and sponsor Ikigai clubs for your students. School leads manage club members, track progress, and connect students with verified mentors — all under one school account.",
  },
  {
    title: "NGO & Organisation",
    accent: "border-accent",
    body: "Partner with Ikigai to sponsor scholarships for youth in your community. Your sponsorship directly funds free platform access for young people who would otherwise not be reached.",
  },
  {
    title: "Premium Leadership",
    accent: "border-earth",
    body: "Intensive leadership development programmes beyond the standard roadmap. Includes advanced workshops, in-person events, and direct access to senior mentors and industry professionals.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Header */}
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Plans & Pricing
            </p>
            <h1 className="font-display mb-5 text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              No one gets left behind.
            </h1>
            <p className="text-xl leading-relaxed text-primary-muted">
              Three ways to access Ikigai — including a fully sponsored
              scholarship for youth who need it most.
            </p>
          </div>
        </section>

        {/* Mentee plans */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionReveal>
              <div className="mb-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  For Mentees
                </p>
                <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
                  Choose how you access a mentor.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  All plans give you full access to the Ikigai platform — mentor
                  matching, growth roadmap, journal, and community. Pricing
                  details are available inside the app.
                </p>
              </div>
            </SectionReveal>

            <div className="grid gap-6 sm:grid-cols-3">
              {MENTEE_PLANS.map((plan, i) => (
                <SectionReveal key={plan.name} delay={i * 0.1}>
                  <div
                    className={`relative flex h-full flex-col rounded-r-2xl border-l-4 bg-card px-6 py-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${plan.accent} ${plan.highlight ? "ring-2 ring-accent/30" : ""}`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-6">
                        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-foreground">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${plan.tagColor} mb-3`}
                      >
                        {plan.tag}
                      </span>
                      <h3 className="font-display text-2xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {plan.priceNote}
                      </p>
                    </div>
                    <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                      {plan.description}
                    </p>
                    <ul className="mb-6 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <svg
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M3 8l3.5 3.5L13 5"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs font-medium text-muted-foreground">
                      {plan.cta}
                    </p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* How payment works */}
        <section className="bg-secondary py-20">
          <SectionReveal>
            <div className="mx-auto max-w-3xl px-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                How It Works
              </p>
              <h2 className="font-display mb-6 text-4xl font-black text-foreground">
                Payment unlocks your mentor.
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Once you complete the Ikigai assessment and choose your mentor
                  through the marketplace, selecting a payment plan unlocks full
                  mentorship access. You will receive an invoice, and your
                  payment history is managed directly in the app.
                </p>
                <p>
                  Automated reminders notify you before your plan renews or
                  expires, so you are never caught off guard. All transactions
                  are secure and documented in your account.
                </p>
                <p>
                  If you are applying for a scholarship, your application is
                  reviewed by our team. Approved applicants receive the same
                  full access as paying members — the only difference is who
                  covers the cost.
                </p>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Partner plans */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionReveal>
              <div className="mb-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  For Organisations
                </p>
                <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
                  Partner with Ikigai.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Schools, NGOs, and organisations can partner with us to bring
                  mentorship and purpose development to young people at scale.
                </p>
              </div>
            </SectionReveal>
            <div className="grid gap-4 sm:grid-cols-3">
              {PARTNER_PLANS.map((p, i) => (
                <SectionReveal key={p.title} delay={i * 0.1}>
                  <div
                    className={`rounded-r-2xl border-l-4 bg-card px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${p.accent}`}
                  >
                    <h3 className="font-display mb-3 text-xl font-bold text-foreground">
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {p.body}
                    </p>
                  </div>
                </SectionReveal>
              ))}
            </div>
            <SectionReveal delay={0.3}>
              <div className="mt-8 rounded-r-2xl border-l-4 border-primary-light bg-card px-6 py-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  For school partnerships, NGO sponsorships, or bulk licensing
                  enquiries, contact us at{" "}
                  <a
                    href="mailto:hello@ikigai.app"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    hello@ikigai.app
                  </a>
                  .
                </p>
              </div>
            </SectionReveal>
          </div>
        </section>

        <InstallCta
          headline="Ready to get started?"
          body="Install the app to explore plans, apply for a scholarship, or connect your school with Ikigai."
        />
      </main>
      <Footer />
    </div>
  );
}
