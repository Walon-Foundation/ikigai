import { clientEnv } from "@/lib/env.client";
import { HeroTree } from "./hero-tree";

const APP_URL = clientEnv.appUrl;

// A server component. This was `"use client"` so that framer-motion could fade
// four elements in on load — ~46KB gzipped of JavaScript, on the page every
// first-time visitor lands on, to do what four CSS keyframes do. The CSS
// version also starts at first paint rather than waiting for a bundle, which
// matters most on exactly the slow connections where the JS looked worst.
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-40">
      {/* Watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none font-black leading-none text-border/60"
        style={{
          fontSize: "clamp(120px, 18vw, 220px)",
          letterSpacing: "-0.06em",
        }}
      >
        IK
      </span>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: text */}
          <div>
            {/* Eyebrow — yellow dot + label */}
            <div className="mb-6 flex animate-fade-up items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Sierra Leone · Youth Platform
              </span>
            </div>

            <h1
              className="font-display mb-6 animate-fade-up text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl"
              style={{ animationDelay: "0.15s" }}
            >
              To build a generation of confident,{" "}
              <span className="relative inline">
                purpose-driven
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-10 h-2.5 rounded-sm bg-accent/30"
                />
              </span>{" "}
              young people across Africa.
            </h1>

            <p
              className="mb-10 max-w-xl animate-fade-up text-xl leading-relaxed text-muted-foreground"
              style={{ animationDelay: "0.3s" }}
            >
              Ikigai connects youth with verified mentors, purpose tools, and a
              community built for their future.
            </p>

            <div
              className="flex animate-fade-up flex-wrap gap-4"
              style={{ animationDelay: "0.45s" }}
            >
              <a
                href={APP_URL}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Install the App
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                How It Works <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          {/* Right: Growth Tree panel — desktop only */}
          <div
            className="hidden animate-fade-up lg:flex lg:justify-center"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="relative w-full max-w-sm">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm">
                {/* Subtle radial glow at base of tree */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 100%, oklch(0.35 0.095 154 / 0.06) 0%, transparent 70%)",
                  }}
                />
                <HeroTree />
                <div className="mt-4 flex justify-center gap-8 border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-lg font-black text-primary">6</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Milestones
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-primary">Lv 3</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Level
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
