"use client";

import { ArrowRight, ChevronLeft, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";
import { saveMenteeAssessment } from "../../actions";

const LOVE_GROUPS: { category: string; items: string[] }[] = [
  {
    category: "Creative",
    items: [
      "Writing",
      "Art & Design",
      "Fashion",
      "Photography",
      "Music & Performance",
      "Film & Video",
      "Content Creation",
      "Craft & Making",
    ],
  },
  {
    category: "Technology",
    items: ["Coding & Software", "AI & Innovation", "Digital Skills", "Gaming"],
  },
  {
    category: "People & Communication",
    items: [
      "Public Speaking",
      "Teaching & Mentoring",
      "Leadership",
      "Communication",
      "Storytelling",
      "Advocacy & Community",
    ],
  },
  {
    category: "Business & Career",
    items: [
      "Entrepreneurship",
      "Business",
      "Marketing",
      "Sales",
      "Finance",
      "Career Development",
    ],
  },
  {
    category: "Learning & Discovery",
    items: [
      "Research",
      "Science",
      "Problem Solving",
      "Reading & Literature",
      "Journalism",
    ],
  },
  {
    category: "Practical Skills",
    items: [
      "Fashion & Tailoring",
      "Beauty & Hair",
      "Cooking",
      "Agriculture",
      "Building & Engineering",
      "Repair & Technical Skills",
    ],
  },
  {
    category: "Wellness & Lifestyle",
    items: ["Sports", "Fitness", "Wellness", "Personal Development"],
  },
  {
    category: "Other",
    items: [],
  },
];
const LOVE_TAGS = LOVE_GROUPS.flatMap((g) => g.items);
const CUSTOM_LOVE_MAX_LENGTH = 40;
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
  const [customLoveInput, setCustomLoveInput] = useState("");
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

  function addCustomLove() {
    const trimmed = customLoveInput.trim().slice(0, CUSTOM_LOVE_MAX_LENGTH);
    if (!trimmed) return;
    setSelected((prev) => {
      const alreadySelected = prev.love.some(
        (t) => t.toLowerCase() === trimmed.toLowerCase(),
      );
      return alreadySelected
        ? prev
        : { ...prev, love: [...prev.love, trimmed] };
    });
    setCustomLoveInput("");
  }

  const customLoveItems = selected.love.filter((t) => !LOVE_TAGS.includes(t));

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

      {section.key === "love" ? (
        <div className="mb-4 space-y-4">
          {LOVE_GROUPS.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      selected.love.includes(tag)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40",
                    )}
                  >
                    {tag}
                  </button>
                ))}
                {group.category === "Other" &&
                  customLoveItems.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all"
                    >
                      {tag} ✕
                    </button>
                  ))}
              </div>
              {group.category === "Other" && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customLoveInput}
                    onChange={(e) => setCustomLoveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomLove();
                      }
                    }}
                    maxLength={CUSTOM_LOVE_MAX_LENGTH}
                    placeholder="Something else you love..."
                    className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomLove}
                    disabled={!customLoveInput.trim()}
                    className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 disabled:opacity-40"
                  >
                    <Plus className="size-4" /> Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
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
      )}

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
          aria-busy={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground disabled:opacity-40"
        >
          <BusyLabel pending={isPending} busy="Saving…">
            {isLast ? "Save & Continue" : "Next"}
            <ArrowRight className="size-4" />
          </BusyLabel>
        </button>
      </div>
    </div>
  );
}
