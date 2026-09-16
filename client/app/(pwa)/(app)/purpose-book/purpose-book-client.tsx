"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/spinner";
import { saveLifeVision } from "./actions";

export function LifeVisionEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    if (value.trim() === initial.trim()) return;
    startTransition(async () => {
      await saveLifeVision(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        rows={5}
        placeholder="Where do you see your life heading? What does success look like for you in 5 years?"
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
      />
      <div className="mt-2 flex h-5 items-center gap-1.5 text-xs text-muted-foreground">
        {pending ? (
          <>
            <Spinner className="size-3.5" /> Saving…
          </>
        ) : saved ? (
          <>
            <Check className="size-3.5 text-primary" /> Saved
          </>
        ) : (
          <span>Autosaves when you tap away</span>
        )}
      </div>
    </div>
  );
}
