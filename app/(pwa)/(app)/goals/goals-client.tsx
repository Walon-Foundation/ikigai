"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addGoal, completeGoal, deleteGoal } from "./actions";

export function AddGoalForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handle(formData: FormData) {
    startTransition(async () => {
      await addGoal({
        title: String(formData.get("title") ?? ""),
        detail: String(formData.get("detail") ?? ""),
        targetDate: String(formData.get("targetDate") ?? ""),
      });
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" /> Add goal
      </button>
    );
  }

  return (
    <form
      action={handle}
      className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4"
    >
      <input
        name="title"
        required
        placeholder="What do you want to achieve?"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <textarea
        name="detail"
        rows={2}
        placeholder="Details (optional)"
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        name="targetDate"
        type="date"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save goal"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function GoalActions({
  goalId,
  done,
}: {
  goalId: string;
  done: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      {!done && (
        <button
          type="button"
          aria-label="Complete goal"
          onClick={() =>
            startTransition(async () => {
              await completeGoal(goalId);
              router.refresh();
            })
          }
          disabled={pending}
          className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Check className="size-4" />
        </button>
      )}
      <button
        type="button"
        aria-label="Delete goal"
        onClick={() =>
          startTransition(async () => {
            await deleteGoal(goalId);
            router.refresh();
          })
        }
        disabled={pending}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
