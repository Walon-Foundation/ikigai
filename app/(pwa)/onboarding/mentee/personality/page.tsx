"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { saveMenteePersonality } from "../../actions";

const SCALES = [
  {
    key: "introvertExtrovert" as const,
    left: "Introvert",
    right: "Extrovert",
    leftDesc: "I recharge alone",
    rightDesc: "I recharge with others",
  },
  {
    key: "structuredFlexible" as const,
    left: "Structured",
    right: "Flexible",
    leftDesc: "I like plans and routines",
    rightDesc: "I adapt as I go",
  },
  {
    key: "creativeAnalytical" as const,
    left: "Creative",
    right: "Analytical",
    leftDesc: "I think in ideas",
    rightDesc: "I think in logic",
  },
  {
    key: "independentCollaborative" as const,
    left: "Independent",
    right: "Collaborative",
    leftDesc: "I work best alone",
    rightDesc: "I thrive in teams",
  },
];

type Scores = {
  introvertExtrovert: number;
  structuredFlexible: number;
  creativeAnalytical: number;
  independentCollaborative: number;
};

export default function PersonalityPage() {
  const [scores, setScores] = useState<Scores>({
    introvertExtrovert: 3,
    structuredFlexible: 3,
    creativeAnalytical: 3,
    independentCollaborative: 3,
  });
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        How do you work best?
      </h2>
      <p className="mb-8 text-muted-foreground">
        Slide each bar to where you naturally fall. There are no right answers.
      </p>

      <div className="space-y-8">
        {SCALES.map((scale) => (
          <div key={scale.key}>
            <div className="mb-3 flex justify-between text-sm font-semibold text-foreground">
              <span>{scale.left}</span>
              <span>{scale.right}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={scores[scale.key]}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [scale.key]: Number(e.target.value),
                }))
              }
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{scale.leftDesc}</span>
              <span>{scale.rightDesc}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => saveMenteePersonality(scores))}
        disabled={isPending}
        aria-busy={isPending}
        className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        <BusyLabel pending={isPending} busy="Saving…">
          Continue <ArrowRight className="size-4" />
        </BusyLabel>
      </button>
    </div>
  );
}
