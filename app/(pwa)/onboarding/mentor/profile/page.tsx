"use client";

import { useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { AvatarUpload } from "@/components/avatar-upload";
import { MissingFields } from "@/components/missing-fields";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";
import { saveMentorProfile } from "../../actions";

const EXPERTISE_TAGS = [
  "Leadership",
  "Technology",
  "Business",
  "Healthcare",
  "Education",
  "Arts",
  "Finance",
  "Engineering",
  "Law",
  "Media",
  "Agriculture",
  "Science",
];
const LANGUAGES = ["English", "Krio", "Temne", "Mende", "French", "Arabic"];

export default function MentorProfilePage() {
  const { user } = useUser();
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [industry, setIndustry] = useState("");
  const [years, setYears] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [location, setLocation] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Named, in the user's words, not the validator's. "Your bio needs at least
  // 20 characters" is a rule nobody could infer from a greyed-out button.
  const missing = [
    bio.trim().length > 20 ? null : "A short bio — at least 20 characters",
    expertise.length > 0 ? null : "At least one area of expertise",
    industry.length > 0 ? null : "Your industry",
    years.length > 0 ? null : "Your years of experience",
    location.length > 0 ? null : "Where you're based",
  ].filter((f): f is string => f !== null);

  function toggleTag(
    tag: string,
    list: string[],
    setter: (v: string[]) => void,
  ) {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  function handleSubmit() {
    // Say what's wrong instead of silently doing nothing.
    if (missing.length > 0) {
      setShowMissing(true);
      return;
    }
    startTransition(() =>
      saveMentorProfile({
        bio,
        expertise,
        industry,
        yearsExperience: Number(years),
        languages,
        location,
      }),
    );
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Your mentor profile
      </h2>
      <p className="mb-8 text-muted-foreground">
        Tell mentees about yourself. This becomes your public profile.
      </p>

      <div className="space-y-6">
        <div className="flex justify-center">
          <AvatarUpload
            name={user?.fullName ?? user?.firstName ?? "You"}
            initialUrl={user?.imageUrl}
          />
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Bio{" "}
            <span className="text-muted-foreground">(min 20 characters)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Share your background, expertise, and what drives you to mentor..."
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-2 block text-sm font-semibold text-foreground">
            Areas of expertise
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag, expertise, setExpertise)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  expertise.includes(tag)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="industry"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Industry
            </label>
            <input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Technology"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="years"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Years of experience
            </label>
            <input
              id="years"
              type="number"
              min={0}
              max={50}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 block text-sm font-semibold text-foreground">
            Languages
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleTag(lang, languages, setLanguages)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  languages.includes(lang)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="location"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Location
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Freetown"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        aria-busy={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        <BusyLabel pending={isPending} busy="Saving…">
          Continue <ArrowRight className="size-4" />
        </BusyLabel>
      </button>
      {showMissing && <MissingFields fields={missing} />}
    </div>
  );
}
