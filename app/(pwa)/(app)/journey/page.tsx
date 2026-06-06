import { and, eq } from "drizzle-orm";
import { Check, Lock } from "lucide-react";
import { GrowthTree } from "@/components/growth-tree";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { growthTrees, mentorships, tasks } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { getMenteeProgress } from "@/lib/progress";

export default async function JourneyPage() {
  const user = await requireRole(["mentee"]);

  const [progress, [treeRow], completedTaskRows] = await Promise.all([
    getMenteeProgress(user),
    db
      .select({ health: growthTrees.health })
      .from(growthTrees)
      .where(eq(growthTrees.userId, user.id))
      .limit(1),
    db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .where(
        and(eq(mentorships.menteeId, user.id), eq(tasks.status, "completed")),
      ),
  ]);

  const treeHealth = treeRow?.health ?? 100;
  const completedTaskCount = completedTaskRows.length;
  const earnedBadges = progress.phases.filter((p) => p.complete);

  return (
    <>
      <PageHeader title="Journey" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Tree + stage */}
        <div className="mb-6 flex flex-col items-center rounded-3xl border border-border bg-card p-8">
          <GrowthTree
            completedCount={completedTaskCount}
            level={progress.stage}
            health={treeHealth}
          />
          <p className="mt-3 font-display text-lg font-bold text-foreground">
            {progress.stageName} stage
          </p>
          <p className="text-sm text-muted-foreground">
            {progress.currentPhase.name}
          </p>
        </div>

        {/* Overall completion */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              Roadmap completion
            </span>
            <span className="text-muted-foreground">
              {progress.completedSteps}/{progress.totalSteps} steps ·{" "}
              {progress.percent}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-primary transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Achievements
            </p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((p) => (
                <span
                  key={p.key}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                >
                  <Check className="size-3.5" />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* The four phases */}
        <div className="space-y-4">
          {progress.phases.map((phase, i) => {
            const isCurrent = phase.key === progress.currentPhase.key;
            const started = i === 0 || progress.phases[i - 1].complete;
            return (
              <div
                key={phase.key}
                className={`rounded-2xl border p-5 ${
                  isCurrent
                    ? "border-primary bg-primary-muted/10"
                    : "border-border bg-card"
                } ${started ? "" : "opacity-60"}`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-display text-base font-black text-foreground">
                    {phase.name}
                  </span>
                  {phase.complete && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Complete
                    </span>
                  )}
                  {isCurrent && !phase.complete && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      In progress
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  {phase.blurb}
                </p>
                <div className="space-y-2">
                  {phase.steps.map((step) => (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                          step.complete
                            ? "bg-primary"
                            : "border-2 border-dashed border-border"
                        }`}
                      >
                        {step.complete ? (
                          <Check className="size-3.5 text-primary-foreground" />
                        ) : (
                          <Lock className="size-3 text-muted-foreground" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          step.complete
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
