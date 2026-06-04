import { eq } from "drizzle-orm";
import { Check, Lock } from "lucide-react";
import { GrowthTree } from "@/components/growth-tree";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { milestones } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

const LEVELS = [
  {
    level: 1,
    name: "Explorer",
    emoji: "🌱",
    desc: "Beginning your ikigai journey",
    required: 3,
  },
  {
    level: 2,
    name: "Advocate",
    emoji: "🌿",
    desc: "Growing your impact in the community",
    required: 6,
  },
  {
    level: 3,
    name: "Mentor",
    emoji: "🌳",
    desc: "Guiding others on their journey",
    required: 10,
  },
];

const ALL_MILESTONE_TYPES = [
  { type: "purpose_quiz", label: "Complete the Purpose Quiz" },
  { type: "first_journal", label: "Write your first journal entry" },
  { type: "safety_module", label: "Complete the Safety Module" },
  { type: "mentor_connect", label: "Connect with a mentor" },
  { type: "pad_her_power", label: "Complete Pad Her Power module" },
];

export default async function JourneyPage() {
  const user = await getDbUser();
  const completedRows = user
    ? await db.select().from(milestones).where(eq(milestones.userId, user.id))
    : [];

  const completedTypes = new Set(completedRows.map((m) => m.type));
  const completedMilestones = ALL_MILESTONE_TYPES.filter((m) =>
    completedTypes.has(m.type),
  );
  const incompleteMilestones = ALL_MILESTONE_TYPES.filter(
    (m) => !completedTypes.has(m.type),
  );
  const completed = completedMilestones.length;
  const nextLevelRequired = 6;
  const progress = Math.min((completed / nextLevelRequired) * 100, 100);

  return (
    <>
      <PageHeader title="Journey" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Tree Visual */}
        <div className="mb-6 flex flex-col items-center rounded-3xl border border-border bg-card p-8">
          <GrowthTree
            completedCount={completed}
            level={user?.growthLevel ?? 1}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {completed} milestone{completed !== 1 ? "s" : ""} completed
          </p>
        </div>

        {/* Progress */}
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
            Complete {Math.max(0, nextLevelRequired - completed)} more
            milestones to reach Advocate level
          </p>
        </div>

        {/* Level Path */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Path
          </p>
          <div className="space-y-3">
            {LEVELS.map((lvl) => {
              const isActive = lvl.level === (user?.growthLevel ?? 1);
              const isLocked = lvl.level > (user?.growthLevel ?? 1);
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
            {completedMilestones.map((m) => {
              const row = completedRows.find((r) => r.type === m.type);
              return (
                <div
                  key={m.type}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary">
                    <Check className="size-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {m.label}
                    </p>
                    {row?.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Completed{" "}
                        {new Date(row.completedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {incompleteMilestones.map((m) => (
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
    </>
  );
}
