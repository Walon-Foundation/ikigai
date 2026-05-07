"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTEREST_TAGS, QUIZ_QUESTIONS } from "@/lib/mock-data";
import { completeOnboarding } from "./actions";

type Role = "mentee" | "mentor" | "club_lead";

const ROLES = [
  {
    value: "mentee" as Role,
    emoji: "🌱",
    title: "Mentee",
    desc: "I'm a student looking to discover my purpose and grow with a mentor.",
  },
  {
    value: "mentor" as Role,
    emoji: "🤝",
    title: "Mentor",
    desc: "I'm a professional ready to guide and invest in the next generation.",
  },
  {
    value: "club_lead" as Role,
    emoji: "🏫",
    title: "Club Lead",
    desc: "I'm a student leader building an Ikigai club at my school.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  const totalSteps = 4;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function selectAnswer(questionId: string, idx: number) {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: idx }));
  }

  const quizComplete = Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-black text-primary">
              Ikigai
            </span>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Step 1: Role */}
        {step === 1 && (
          <div>
            <h2 className="font-display mb-2 text-3xl font-black text-foreground">
              How will you join?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Choose your role to personalise your Ikigai experience.
            </p>
            <div className="space-y-4">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all",
                    role === r.value
                      ? "border-primary bg-primary-muted/20"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-bold text-foreground">
                        {r.title}
                      </span>
                      {role === r.value && (
                        <Check className="size-5 text-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!role}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
            <h2 className="font-display mb-2 text-3xl font-black text-foreground">
              What are your interests?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Select at least 3 topics — we use these to find your best mentor
              match.
            </p>
            <div className="flex flex-wrap gap-3">
              {INTEREST_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    selectedTags.includes(tag)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {selectedTags.length} selected
              {selectedTags.length < 3 && ` (${3 - selectedTags.length} more needed)`}
            </p>
            <button
              onClick={() => setStep(3)}
              disabled={selectedTags.length < 3}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* Step 3: Purpose Quiz */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
            <h2 className="font-display mb-2 text-3xl font-black text-foreground">
              Purpose Discovery Quiz
            </h2>
            <p className="mb-8 text-muted-foreground">
              Answer honestly — there are no right or wrong answers.
            </p>
            <div className="space-y-8">
              {QUIZ_QUESTIONS.map((q, qi) => (
                <div key={q.id}>
                  <p className="mb-3 font-semibold text-foreground">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => selectAnswer(q.id, oi)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                          quizAnswers[q.id] === oi
                            ? "border-primary bg-primary-muted/20 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                            quizAnswers[q.id] === oi
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          )}
                        >
                          {quizAnswers[q.id] === oi ? (
                            <Check className="size-3" />
                          ) : (
                            String.fromCharCode(65 + oi)
                          )}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(4)}
              disabled={!quizComplete}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Complete Quiz <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-6 text-8xl">🌱</div>
            <h2 className="font-display mb-3 text-4xl font-black text-foreground">
              You&apos;re an Explorer!
            </h2>
            <p className="mb-2 text-lg font-semibold text-primary">Level 1</p>
            <p className="mb-10 max-w-md text-muted-foreground">
              Your ikigai journey begins now. We&apos;ve used your interests and
              quiz results to prepare your personalised dashboard and mentor
              matches.
            </p>
            <div className="mb-6 w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Your first milestones
              </p>
              <ul className="space-y-2">
                {[
                  "Complete the Purpose Quiz ✓",
                  "Get matched with a mentor",
                  "Write your first journal entry",
                  "Complete the Safety Module",
                ].map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-primary" />
                    <span className={m.includes("✓") ? "text-foreground" : "text-muted-foreground"}>
                      {m.replace(" ✓", "")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() =>
                startTransition(() =>
                  completeOnboarding({ role: role!, interestTags: selectedTags })
                )
              }
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>Go to My Dashboard <ArrowRight className="size-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
