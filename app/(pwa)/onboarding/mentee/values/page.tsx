"use client";

import { ArrowRight, GripVertical } from "lucide-react";
import { useState, useTransition } from "react";
import { saveMenteeValues } from "../../actions";

const DEFAULT_VALUES = [
  "Integrity",
  "Service",
  "Creativity",
  "Leadership",
  "Family",
  "Innovation",
];

export default function ValuesPage() {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [isPending, startTransition] = useTransition();

  function moveUp(i: number) {
    if (i === 0) return;
    setValues((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    if (i === values.length - 1) return;
    setValues((prev) => {
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        What do you value most?
      </h2>
      <p className="mb-8 text-muted-foreground">
        Tap the arrows to rank these values — most important at the top.
      </p>

      <div className="space-y-2">
        {values.map((value, i) => (
          <div
            key={value}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium text-foreground">{value}</span>
            <span className="text-xs font-bold text-primary">#{i + 1}</span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="rounded px-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === values.length - 1}
                className="rounded px-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => saveMenteeValues(values))}
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
