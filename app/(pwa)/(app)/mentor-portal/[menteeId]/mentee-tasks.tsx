"use client";

import { Check, Loader2, Plus, Sprout, X } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { assignTask, completeTask, failTask } from "../actions";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  growthPoints: number;
  createdAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-accent-pale text-earth",
  completed: "bg-primary-muted/30 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

export function MenteeTasks({
  mentorshipId,
  initialTasks,
}: {
  mentorshipId: string;
  initialTasks: TaskItem[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    if (!title.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await assignTask({ mentorshipId, title, description });
        setTitle("");
        setDescription("");
        setShowForm(false);
      } catch {
        setError("Could not assign the task. Try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tasks
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-light"
        >
          <Plus className="size-3.5" /> Assign task
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-xl border border-border bg-background p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Advice or detail (optional)"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!title.trim() || isPending}
              className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Assign
            </button>
          </div>
        </div>
      )}

      {initialTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sprout className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No tasks yet. Assign one to grow their tree.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  const [isPending, startTransition] = useTransition();
  const isOpen = task.status === "assigned";

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{task.title}</p>
          {task.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            STATUS_STYLES[task.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {task.status}
        </span>
      </div>

      {isOpen && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await completeTask(task.id);
              })
            }
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Complete
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await failTask(task.id);
              })
            }
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-destructive/40 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
          >
            <X className="size-3.5" /> Mark failed
          </button>
        </div>
      )}
    </div>
  );
}
