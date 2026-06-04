"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setRole } from "./actions";

type Role = "mentee" | "mentor" | "parent";

const ROLES = [
  {
    value: "mentee" as Role,
    emoji: "🌱",
    title: "Mentee",
    desc: "I'm a young person looking to discover my purpose and grow with a mentor.",
  },
  {
    value: "mentor" as Role,
    emoji: "🤝",
    title: "Mentor",
    desc: "I'm a professional ready to guide and invest in the next generation.",
  },
  {
    value: "parent" as Role,
    emoji: "👨‍👩‍👧",
    title: "Parent / Guardian",
    desc: "I want to support and oversee my child's mentorship journey.",
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    if (!selected) return;
    startTransition(() => setRole(selected));
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        How will you join?
      </h2>
      <p className="mb-8 text-muted-foreground">
        Choose your role to personalise your experience.
      </p>
      <div className="space-y-4">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setSelected(r.value)}
            className={cn(
              "flex w-full items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all",
              selected === r.value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span className="text-3xl">{r.emoji}</span>
            <div className="flex-1">
              <p className="font-display text-lg font-bold text-foreground">
                {r.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
