"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveMentorPricing } from "../../actions";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const PACKAGE_TYPES = ["1-on-1 Sessions", "Group Sessions", "Both"];

export default function MentorPricingPage() {
  const [hourlyRate, setHourlyRate] = useState("");
  const [packageType, setPackageType] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const canContinue =
    hourlyRate.length > 0 && packageType !== null && availability.length > 0;

  function toggleDay(day: string) {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Pricing & availability
      </h2>
      <p className="mb-8 text-muted-foreground">
        Set your session rate and when you are available.
      </p>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="hourly-rate"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Hourly rate (NLE)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">NLE</span>
            <input
              id="hourly-rate"
              type="number"
              min={0}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g. 50000"
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter 0 for pro bono / scholarship mentoring
          </p>
        </div>

        <div>
          <p className="mb-2 block text-sm font-semibold text-foreground">
            Session type
          </p>
          <div className="space-y-2">
            {PACKAGE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPackageType(type)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                  packageType === type
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 block text-sm font-semibold text-foreground">
            Available days
          </p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  availability.includes(day)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          startTransition(() =>
            saveMentorPricing({
              hourlyRate: Number(hourlyRate),
              packageTypes: packageType ? [packageType] : [],
              availability,
            }),
          )
        }
        disabled={!canContinue || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
