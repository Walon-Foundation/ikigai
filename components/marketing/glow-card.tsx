// components/marketing/glow-card.tsx

import { cn } from "@/lib/utils";

interface GlowCardProps {
  num: string;
  title: string;
  body: string;
  variant: "green" | "amber" | "earth" | "sage";
  className?: string;
}

const VARIANTS = {
  green: {
    bg: "oklch(0.96 0.02 154)",
    glow: "rgba(26, 92, 58, 0.22)",
    border: "border-primary/10",
    ring: "hover:ring-2 hover:ring-primary/20",
    label: "text-primary",
  },
  amber: {
    bg: "oklch(0.97 0.03 75)",
    glow: "rgba(245, 166, 35, 0.28)",
    border: "border-accent/10",
    ring: "hover:ring-2 hover:ring-accent/20",
    label: "text-accent",
  },
  earth: {
    bg: "oklch(0.96 0.025 35)",
    glow: "rgba(192, 92, 58, 0.22)",
    border: "border-earth/10",
    ring: "hover:ring-2 hover:ring-earth/20",
    label: "text-earth",
  },
  sage: {
    bg: "oklch(0.96 0.02 155)",
    glow: "rgba(46, 139, 87, 0.22)",
    border: "border-primary-light/10",
    ring: "hover:ring-2 hover:ring-primary-light/20",
    label: "text-primary-light",
  },
} as const;

export function GlowCard({
  num,
  title,
  body,
  variant,
  className,
}: GlowCardProps) {
  const v = VARIANTS[variant];
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border transition-transform duration-200 hover:-translate-y-1",
        v.border,
        v.ring,
        className,
      )}
      style={{ background: v.bg }}
    >
      {/* Radial glow overlay — blooms from bottom-left on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 10% 90%, ${v.glow} 0%, transparent 65%)`,
        }}
      />
      <div className="relative z-10 flex flex-1 flex-col p-5">
        <p
          className={cn(
            "mb-2 text-[10px] font-extrabold uppercase tracking-widest",
            v.label,
          )}
        >
          {num}
        </p>
        <h3 className="font-display mb-3 text-xl font-bold text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
