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
