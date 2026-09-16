import { Compass, Heart, Sparkles, Target } from "lucide-react";

// The rich onboarding profile lives in users.onboardingData (untyped jsonb).
// This mirrors the shape written by the mentee onboarding actions.
type OnboardingData = {
  assessment?: {
    love?: string[];
    skills?: string[];
    community?: string[];
    opportunity?: string[];
  };
  valuesRanking?: string[];
  personality?: {
    introvertExtrovert: number;
    structuredFlexible: number;
    creativeAnalytical: number;
    independentCollaborative: number;
  };
  purposeProfile?: {
    statement?: string;
    interests?: string[];
    values?: string[];
    personalityLabel?: string;
  };
};

const AXES: {
  key: keyof NonNullable<OnboardingData["personality"]>;
  low: string;
  high: string;
}[] = [
  { key: "introvertExtrovert", low: "Introverted", high: "Extroverted" },
  { key: "structuredFlexible", low: "Structured", high: "Flexible" },
  { key: "creativeAnalytical", low: "Creative", high: "Analytical" },
  {
    key: "independentCollaborative",
    low: "Independent",
    high: "Collaborative",
  },
];

function Quadrant({
  icon: Icon,
  label,
  tags,
}: {
  icon: typeof Heart;
  label: string;
  tags?: string[];
}) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] capitalize text-primary"
          >
            {t.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MenteeProfileCard({
  onboardingData,
}: {
  onboardingData: unknown;
}) {
  const data = (onboardingData as OnboardingData | null) ?? {};
  const { assessment, valuesRanking, personality, purposeProfile } = data;

  const hasContent =
    purposeProfile?.statement ||
    assessment?.love?.length ||
    assessment?.skills?.length ||
    (valuesRanking && valuesRanking.length > 0) ||
    personality;

  if (!hasContent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">
          Purpose profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This mentee hasn't completed their Ikigai assessment yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 font-display text-base font-bold text-foreground">
        Purpose profile
      </h2>

      {purposeProfile?.statement && (
        <p className="mb-4 rounded-xl bg-primary/5 p-3 text-sm italic text-foreground">
          "{purposeProfile.statement}"
        </p>
      )}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ikigai
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Quadrant icon={Heart} label="Loves" tags={assessment?.love} />
        <Quadrant icon={Sparkles} label="Good at" tags={assessment?.skills} />
        <Quadrant
          icon={Compass}
          label="Community needs"
          tags={assessment?.community}
        />
        <Quadrant
          icon={Target}
          label="Opportunities"
          tags={assessment?.opportunity}
        />
      </div>

      {valuesRanking && valuesRanking.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top values
          </p>
          <ol className="flex flex-wrap gap-1.5">
            {valuesRanking.slice(0, 5).map((v, i) => (
              <li
                key={v}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
              >
                {i + 1}. {v}
              </li>
            ))}
          </ol>
        </div>
      )}

      {personality && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Personality
          </p>
          <div className="space-y-2">
            {AXES.map((axis) => {
              const value = personality[axis.key] ?? 3;
              const pct = ((value - 1) / 4) * 100;
              return (
                <div key={axis.key}>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{axis.low}</span>
                    <span>{axis.high}</span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
                      style={{ left: `calc(${pct}% - 6px)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
