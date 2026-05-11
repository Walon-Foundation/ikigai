"use client";

import { Loader2, School } from "lucide-react";
import { useState, useTransition } from "react";
import { registerSchool } from "./actions";

export function RegisterSchoolForm() {
  const [name, setName] = useState("");
  const [region, setRegion] = useState<"freetown" | "western_rural">(
    "freetown",
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await registerSchool({ name, region });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="school-name"
          className="mb-1.5 block text-sm font-semibold text-foreground"
        >
          School name
        </label>
        <input
          id="school-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Annie Walsh Memorial School"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
        />
      </div>

      <div>
        <p className="mb-1.5 block text-sm font-semibold text-foreground">
          Region
        </p>
        <div className="flex gap-2">
          {(["freetown", "western_rural"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium capitalize transition-all ${
                region === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {r === "freetown" ? "Freetown" : "Western Rural"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!name.trim() || isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <School className="size-4" />
        )}
        {isPending ? "Registering…" : "Register School"}
      </button>
    </form>
  );
}
