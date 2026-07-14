"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
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
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!value.trim()) return;
    const comment = value;
    startTransition(async () => {
      try {
        await addJournalFeedback({ entryId, menteeId, comment });
        // Only clear once it has actually been saved. Clearing up-front threw
        // the mentor's typed feedback away the moment the request failed, with
        // nothing on screen to say it hadn't sent.
        setValue("");
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFailed(false);
          }}
          placeholder="Leave feedback…"
          className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={send}
          disabled={pending || !value.trim()}
          aria-busy={pending}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          <BusyLabel pending={pending} busy="Sending…">
            Send
          </BusyLabel>
        </button>
      </div>
      {failed && (
        <p className="mt-1 text-[11px] font-semibold text-destructive">
          Couldn&apos;t send — your feedback is still here, try again.
        </p>
      )}
    </div>
  );
}
