"use client";

import { motion } from "framer-motion";
import { GrowthTree } from "@/components/growth-tree";

const APP_URL = `https://${process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.ikigai.app"}`;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary pb-24 pt-40">
      {/* Floating blobs */}
      <motion.div
        className="pointer-events-none absolute -left-20 -top-20 h-[320px] w-[320px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(245,166,35,0.2) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 22, -10, 0], y: [0, -16, 12, 0], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-16 -right-16 h-[280px] w-[280px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168,213,181,0.16) 0%, transparent 70%)",
        }}
        animate={{ x: [0, -18, 12, 0], y: [0, 14, -8, 0], scale: [1, 1.04, 0.96, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-0 top-1/3 h-[200px] w-[200px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(46,139,87,0.22) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 12, -6, 0], y: [0, 18, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content — split on desktop */}
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-block rounded-full bg-primary-muted/20 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary-muted"
            >
              For Youth · Sierra Leone
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-display mb-6 text-5xl font-black leading-[1.05] tracking-tight text-primary-foreground sm:text-6xl"
            >
              To build a generation of confident,{" "}
              <span className="text-accent">purpose-driven</span> young people
              across Africa.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10 max-w-xl text-xl leading-relaxed text-primary-muted"
            >
              Ikigai connects youth with verified mentors, purpose tools, and a
              community built for their future.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4"
            >
              <a
                href={APP_URL}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-semibold text-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Install the App
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary-muted/40 px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:border-primary-muted"
              >
                How It Works →
              </a>
            </motion.div>
          </div>

          {/* Right: Growth Tree — desktop only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:justify-center"
          >
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-4 rounded-3xl bg-primary-muted/10 blur-xl" />
              <div className="relative rounded-3xl border border-primary-muted/20 bg-primary-foreground/5 p-8 backdrop-blur-sm">
                <GrowthTree completedCount={6} level={3} />
                <p className="mt-3 text-center text-xs font-medium text-primary-muted">
                  Your growth, visualised
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
