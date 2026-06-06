"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addJournalFeedback } from "./feedback-actions";

export function FeedbackForm({
  entryId,
  menteeId,
}: {
  entryId: string;
  menteeId: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    if (!value.trim()) return;
    const comment = value;
    setValue("");
    startTransition(async () => {
      await addJournalFeedback({ entryId, menteeId, comment });
      router.refresh();
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Leave feedback…"
        className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={send}
        disabled={pending || !value.trim()}
        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
      >
        {pending ? "…" : "Send"}
      </button>
    </div>
  );
}
