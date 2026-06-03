"use client";

import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: "01",
    eyebrow: "Assessment",
    title: "Discover Your Ikigai",
    body: "Complete our comprehensive self-discovery assessment — what you love, what you are good at, what your community needs, and what creates opportunity for you. At the end, you receive a personalised Purpose Profile and a Purpose Statement written just for you.",
    tag: "Self-Discovery",
  },
  {
    num: "02",
    eyebrow: "AI Matching",
    title: "Meet Your Mentor",
    body: "Our algorithm matches you with the top five mentors based on shared interests, values, personality, and career alignment. Browse the mentor marketplace, choose yours, and begin a 3-day icebreaker phase before committing to the relationship.",
    tag: "Mentor Marketplace",
  },
  {
    num: "03",
    eyebrow: "Your Plan",
    title: "Choose Your Plan",
    body: "Select a mentor subscription, a one-time package, or apply for a sponsored scholarship — no one is left behind due to financial barriers. Payment unlocks full mentorship access, and your invoice history and reminders are all managed in the app.",
    tag: "Flexible Plans",
  },
  {
    num: "04",
    eyebrow: "Growth Roadmap",
    title: "Follow Your Roadmap",
    body: "Work through four structured phases — Find Yourself, Build Yourself, Discover Purpose, and Create Impact. Every milestone you complete — a session, journal entry, workshop, or assessment — grows your personal Growth Tree and contributes to your overall progress.",
    tag: "4 Phases",
  },
  {
    num: "05",
    eyebrow: "Community",
    title: "Create Impact",
    body: "Attend signature events like the Finding Yourself Picnic, complete three verified in-person mentor meetings, engage in community projects and advocacy, and graduate as a confident, purpose-driven leader ready to give back to Sierra Leone.",
    tag: "Graduate & Lead",
  },
] as const;

function StepItem({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "grid items-start gap-6 border-b border-border py-14 sm:grid-cols-[100px_1fr] sm:gap-12",
        isEven && "sm:grid-cols-[1fr_100px]",
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : `translateX(${isEven ? "56px" : "-56px"})`,
        transition:
          "opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Number */}
      <div
        className={cn(
          "font-display text-7xl font-black leading-none transition-colors duration-500 sm:text-8xl",
          isEven && "sm:order-2 sm:text-right",
        )}
        style={{ color: visible ? "#1A5C3A" : "#E5E2DC" }}
      >
        {step.num}
      </div>

      {/* Text */}
      <div className={cn(isEven && "sm:order-1")}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-muted">
          {step.eyebrow}
        </p>
        <h3 className="font-display mb-4 text-3xl font-black leading-tight text-foreground sm:text-4xl">
          {step.title}
        </h3>
        <p className="mb-5 text-base leading-relaxed text-muted-foreground">
          {step.body}
        </p>
        <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-primary">
          {step.tag}
        </span>
      </div>
    </div>
  );
}

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
