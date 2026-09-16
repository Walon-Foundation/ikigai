import { and, eq } from "drizzle-orm";
import { GrowthTree } from "@/components/growth-tree-lazy";
import { PageHeader } from "@/components/page-header";
import { SkillTracks } from "@/components/skill-tracks";
import { db } from "@/db/db";
import { growthTrees, mentorships, tasks } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { getMenteeProgress } from "@/lib/progress";
import { getOrCreateSkillTracks } from "@/lib/skill-tracks";

export default async function JourneyPage() {
  const user = await requireRole(["mentee"]);

  const [progress, [treeRow], completedTaskRows, skillTracks] =
    await Promise.all([
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
      getOrCreateSkillTracks(user),
    ]);

  const treeHealth = treeRow?.health ?? 100;
  const completedTaskCount = completedTaskRows.length;

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

        {/* Per-skill DISCOVER→THRIVE→BUILD→LEAD tracks, auto-generated from
            each of the mentee's interest tags. See lib/skill-tracks.ts. */}
        <SkillTracks tracks={skillTracks} />
      </div>
    </>
  );
}
