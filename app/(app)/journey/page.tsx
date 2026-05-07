import Link from "next/link";
import { Check, Lock, ChevronRight } from "lucide-react";
import { MOCK_MILESTONES, INCOMPLETE_MILESTONES } from "@/lib/mock-data";

const LEVELS = [
  {
    level: 1,
    name: "Explorer",
    emoji: "🌱",
    desc: "Beginning your ikigai journey",
    color: "bg-primary",
    required: 3,
  },
  {
    level: 2,
    name: "Advocate",
    emoji: "🌿",
    desc: "Growing your impact in the community",
    color: "bg-primary-light",
    required: 6,
  },
  {
    level: 3,
    name: "Mentor",
    emoji: "🌳",
    desc: "Guiding others on their journey",
    color: "bg-primary",
    required: 10,
  },
];

export default function JourneyPage() {
  const completed = MOCK_MILESTONES.length;
  const nextLevelRequired = 6;
  const progress = Math.min((completed / nextLevelRequired) * 100, 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">
          Growth Tree
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your purpose journey
        </p>
      </div>

      {/* Tree Visual */}
      <div className="mb-6 flex flex-col items-center rounded-3xl border border-border bg-card p-8">
        <div className="relative flex flex-col items-center">
          {/* Canopy */}
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-primary-muted/30 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-primary-muted/50 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-primary-muted flex items-center justify-center text-3xl">
                  🌳
                </div>
              </div>
            </div>
            {/* Floating leaves */}
            <span className="absolute -right-3 top-2 text-lg">🍃</span>
            <span className="absolute -left-4 top-6 text-base">🍃</span>
            <span className="absolute right-0 bottom-2 text-sm">🌿</span>
          </div>
          {/* Trunk */}
          <div className="h-10 w-3 rounded-b-full bg-primary/40" />
          {/* Ground */}
          <div className="h-2 w-24 rounded-full bg-primary-muted/40" />
        </div>

        <div className="mt-6 text-center">
          <span className="rounded-full bg-primary-muted/20 px-3 py-1 text-sm font-semibold text-primary">
            Explorer — Level 1
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            {completed} milestones completed
          </p>
        </div>
      </div>

      {/* Progress to next level */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            Progress to Advocate
          </span>
          <span className="text-muted-foreground">
            {completed}/{nextLevelRequired} milestones
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Complete {nextLevelRequired - completed} more milestones to reach
          Advocate level
        </p>
      </div>

      {/* Level Path */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Path
        </p>
        <div className="space-y-3">
          {LEVELS.map((lvl, i) => {
            const isActive = lvl.level === 1;
            const isLocked = lvl.level > 1;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-4 rounded-xl border p-4 ${
                  isActive
                    ? "border-primary bg-primary-muted/10"
                    : "border-border bg-card opacity-60"
                }`}
              >
                <span className="text-2xl">{lvl.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {lvl.name}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Current
                      </span>
                    )}
                    {isLocked && (
                      <Lock className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {lvl.required} milestones
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Milestones
        </p>
        <div className="space-y-2">
          {MOCK_MILESTONES.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary">
                <Check className="size-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {m.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Completed{" "}
                  {new Date(m.completedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}

          {INCOMPLETE_MILESTONES.map((m) => (
            <div
              key={m.type}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 opacity-60"
            >
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-border">
                <Lock className="size-3.5 text-muted-foreground" />
              </div>
              <p className="flex-1 text-sm font-medium text-muted-foreground">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
