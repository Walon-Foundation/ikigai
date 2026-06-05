"use client";

import { motion } from "framer-motion";
import { GrowthTree } from "@/components/growth-tree";

const _appHost = process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.localhost:3000";
const APP_URL = `${_appHost.includes("localhost") ? "http" : "https"}://${_appHost}`;

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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 flex items-center gap-2"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Sierra Leone · Youth Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-display mb-6 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl"
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
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-10 max-w-xl text-xl leading-relaxed text-muted-foreground"
            >
              Ikigai connects youth with verified mentors, purpose tools, and a
              community built for their future.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-wrap gap-4"
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
            </motion.div>
          </div>

          {/* Right: Growth Tree panel — desktop only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:justify-center"
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
                <GrowthTree completedCount={6} level={3} />
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
