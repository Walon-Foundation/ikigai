import { desc, eq } from "drizzle-orm";
import { PenLine, Target } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { goals } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { dailyReflectionPrompt } from "@/lib/prompts";
import { AddGoalForm, GoalActions } from "./goals-client";

export default async function GoalsPage() {
  const user = await requireRole(["mentee"]);
  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, user.id))
    .orderBy(desc(goals.createdAt));

  const open = rows.filter((g) => g.status !== "done");
  const done = rows.filter((g) => g.status === "done");
  const prompt = dailyReflectionPrompt();

  return (
    <>
      <PageHeader title="Goals" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Reflection nudge */}
        <Link
          href="/journal"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4"
        >
          <PenLine className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Reflection prompt
            </p>
            <p className="text-sm text-foreground">{prompt}</p>
          </div>
        </Link>

        <AddGoalForm />

        {rows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
            <Target className="size-6 text-primary" />
            <p className="mt-4 font-semibold text-foreground">No goals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a goal to track your growth.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {open.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
            {done.length > 0 && (
              <p className="pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </p>
            )}
            {done.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function GoalRow({ goal }: { goal: typeof goals.$inferSelect }) {
  const done = goal.status === "done";
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 ${
        done ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <p
          className={`font-medium text-foreground ${done ? "line-through" : ""}`}
        >
          {goal.title}
        </p>
        {goal.detail && (
          <p className="text-sm text-muted-foreground">{goal.detail}</p>
        )}
        {goal.targetDate && !done && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Target: {new Date(goal.targetDate).toLocaleDateString("en-GB")}
          </p>
        )}
      </div>
      <GoalActions goalId={goal.id} done={done} />
    </div>
  );
}
