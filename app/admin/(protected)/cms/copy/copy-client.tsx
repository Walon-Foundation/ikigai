"use client";

import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";
import { saveCopy } from "./actions";

// One editable copy block. `fields` describes the inputs; the current values
// come from the stored jsonb. Each block saves independently — editing the
// mission should not require re-saving the hero.
type CopyField = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "lines";
};

export function CopyBlock({
  copyKey,
  title,
  description,
  fields,
  values,
}: {
  copyKey: string;
  title: string;
  description: string;
  fields: CopyField[];
  values: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    const v: Record<string, string> = {};
    for (const f of fields) v[f.name] = String(formData.get(f.name) ?? "");
    startTransition(async () => {
      try {
        await saveCopy(copyKey, v);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground";
  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 className="font-display text-lg font-bold text-foreground">
        {title}
      </h2>
      <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{description}</p>

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`${copyKey}-${f.name}`} className={labelClass}>
              {f.label}
            </label>
            {f.kind === "text" ? (
              <input
                id={`${copyKey}-${f.name}`}
                name={f.name}
                defaultValue={values[f.name]}
                className={inputClass}
              />
            ) : (
              <textarea
                id={`${copyKey}-${f.name}`}
                name={f.name}
                rows={f.kind === "lines" ? 5 : 3}
                defaultValue={values[f.name]}
                className={cn(inputClass, "resize-none")}
              />
            )}
            {f.kind === "lines" && (
              <p className="mt-1 text-xs text-muted-foreground">
                One per line.
              </p>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-40 transition-colors"
        >
          <BusyLabel pending={pending} busy="Saving…">
            {saved ? "Saved ✓" : "Save"}
          </BusyLabel>
        </button>
      </div>
    </form>
  );
}
