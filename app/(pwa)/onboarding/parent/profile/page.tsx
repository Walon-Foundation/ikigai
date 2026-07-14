"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";
import { saveParentProfile } from "../../actions";

const RELATIONSHIPS = [
  "Parent",
  "Guardian",
  "Grandparent",
  "Aunt / Uncle",
  "Older Sibling",
  "Other",
];

export default function ParentProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [relationship, setRelationship] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();

  const canContinue =
    displayName.trim().length > 1 &&
    relationship !== null &&
    phone.trim().length > 6;

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Your details
      </h2>
      <p className="mb-8 text-muted-foreground">
        Tell us a little about yourself so we can set up your guardian account.
      </p>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="displayName"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Full name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-3 block text-sm font-semibold text-foreground">
            Relationship to child
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRelationship(r)}
                className={cn(
                  "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                  relationship === r
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Contact phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+232 76 000 000"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          startTransition(() =>
            saveParentProfile({
              displayName,
              relationship: relationship!,
              phone,
            }),
          )
        }
        disabled={!canContinue || isPending}
        aria-busy={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        <BusyLabel pending={isPending} busy="Saving…">
          Continue <ArrowRight className="size-4" />
        </BusyLabel>
      </button>
    </div>
  );
}
