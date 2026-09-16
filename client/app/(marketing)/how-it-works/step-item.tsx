"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Step } from "./steps";

// The scroll reveal. This is the only part of /how-it-works that needs the
// browser — it used to drag the whole page across the client boundary with it,
// Nav, Footer, InstallCta and every word of the step copy included.
export function StepItem({ step, index }: { step: Step; index: number }) {
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
    // The reveal itself — the slide, the fade and the number's colour — is in
    // `.step-reveal` in app/globals.css, keyed off these two data attributes.
    // As inline styles it was unreachable by `prefers-reduced-motion`, and it
    // hardcoded two light-mode hex values for the number, so in dark mode the
    // page's largest type sat at about 1.4:1 and the pre-reveal grey was
    // invisible on any theme if IntersectionObserver never ran.
    <div
      ref={ref}
      data-visible={visible}
      data-side={isEven ? "right" : "left"}
      className={cn(
        "step-reveal grid items-start gap-6 border-b border-border py-14 sm:grid-cols-[100px_1fr] sm:gap-12",
        isEven && "sm:grid-cols-[1fr_100px]",
      )}
    >
      {/* Number */}
      <div
        className={cn(
          "step-number font-display text-7xl font-black leading-none sm:text-8xl",
          isEven && "sm:order-2 sm:text-right",
        )}
      >
        {step.num}
      </div>

      {/* Text */}
      <div className={cn(isEven && "sm:order-1")}>
        {/* text-primary, not text-primary-muted: this eyebrow is on the page
            background, not on a bg-primary header like every other use of that
            token, where it measured 1.65:1. Matches SectionHeading. */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
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
