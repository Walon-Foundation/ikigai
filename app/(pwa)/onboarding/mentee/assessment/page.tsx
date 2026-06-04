"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveMenteeAssessment } from "../../actions";

const LOVE_TAGS = [
  "Writing",
  "Art",
  "Technology",
  "Public Speaking",
  "Music",
  "Entrepreneurship",
  "Sports",
  "Teaching",
  "Design",
  "Research",
];
const SKILLS_TAGS = [
  "Leadership",
  "Communication",
  "Design",
  "Problem Solving",
  "Organisation",
  "Empathy",
  "Analysis",
  "Creativity",
  "Technology",
  "Writing",
];
const COMMUNITY_TAGS = [
  "Education",
  "Mental Health",
  "Gender Equality",
  "Youth Employment",
  "Climate Action",
  "Healthcare",
  "Safety",
  "Economic Growth",
];
const OPPORTUNITY_TAGS = [
  "Journalism",
  "Business",
  "Technology",
  "Healthcare",
  "Law",
  "Engineering",
  "Education",
  "Arts",
  "Finance",
  "Science",
];

type Section = "love" | "skills" | "community" | "opportunity";

const SECTIONS: {
  key: Section;
  title: string;
  question: string;
  tags: string[];
}[] = [
  {
    key: "love",
    title: "What Do You Love?",
    question: "What activities make you lose track of time?",
    tags: LOVE_TAGS,
  },
  {
    key: "skills",
    title: "What Are You Good At?",
    question: "What skills are you most proud of?",
    tags: SKILLS_TAGS,
  },
  {
    key: "community",
    title: "What Does Your Community Need?",
    question: "What problems concern you most?",
    tags: COMMUNITY_TAGS,
  },
  {
    key: "opportunity",
    title: "What Can Create Opportunities?",
    question: "What career or skill interests you most?",
    tags: OPPORTUNITY_TAGS,
  },
];

export default function AssessmentPage() {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [selected, setSelected] = useState<Record<Section, string[]>>({
    love: [],
    skills: [],
    community: [],
    opportunity: [],
  });
  const [texts, setTexts] = useState<Record<Section, string>>({
    love: "",
    skills: "",
    community: "",
    opportunity: "",
  });
  const [isPending, startTransition] = useTransition();

  const section = SECTIONS[sectionIdx];
  const isLast = sectionIdx === SECTIONS.length - 1;

  function toggleTag(tag: string) {
    setSelected((prev) => {
      const current = prev[section.key];
      return {
        ...prev,
        [section.key]: current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag],
      };
    });
  }

  function handleNext() {
    if (isLast) {
      startTransition(() =>
        saveMenteeAssessment({
          love: selected.love,
          loveText: texts.love,
          skills: selected.skills,
          skillsText: texts.skills,
          community: selected.community,
          communityText: texts.community,
          opportunity: selected.opportunity,
          opportunityText: texts.opportunity,
        }),
      );
    } else {
      setSectionIdx((i) => i + 1);
    }
  }

  return (
    <div>
      {/* Sub-progress dots */}
      <div className="mb-6 flex gap-2">
        {SECTIONS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              i <= sectionIdx ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <h2 className="font-display mb-1 text-3xl font-black text-foreground">
        {section.title}
      </h2>
      <p className="mb-6 text-muted-foreground">{section.question}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {section.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              selected[section.key].includes(tag)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      <textarea
        value={texts[section.key]}
        onChange={(e) =>
          setTexts((prev) => ({ ...prev, [section.key]: e.target.value }))
        }
        placeholder="Add your own thoughts (optional)..."
        rows={3}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      <div className="mt-6 flex gap-3">
        {sectionIdx > 0 && (
          <button
            type="button"
            onClick={() => setSectionIdx((i) => i - 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {isLast ? "Save & Continue" : "Next"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
