"use client";

import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { setEnquiryStatus } from "./actions";

// Options are labelled by their CONSEQUENCE, not by an internal word.
//
// "Handled" reads, in ordinary English, as "I dealt with this" — which is
// exactly what an operator means when they have just declined someone. It
// silently sent that person a congratulatory acceptance email, from an
// unlabelled dropdown, with no warning and no way to recall it. The stored
// value stays `handled` (rows already carry it), but nobody has to know that to
// use this control safely: the option says what it does, and `closed` exists so
// that finishing with an enquiry no longer requires sending mail.
const OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "handled", label: "Accepted — sends acceptance email" },
  { value: "closed", label: "Closed — no email" },
];

/** The only option that mails the enquirer, and so the only one that asks. */
const SENDS_EMAIL = "handled";

export function StatusControl({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  // The status picked but not yet committed, held while we confirm. The select
  // shows it so the operator can see what they chose, but nothing is written
  // and no mail is sent until they say yes.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function commit(next: string) {
    setFailed(false);
    startTransition(async () => {
      try {
        await setEnquiryStatus(id, next);
        setConfirming(null);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="relative">
      <select
        value={confirming ?? status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (next === SENDS_EMAIL) {
            // Irreversible and outbound: ask before it leaves.
            setFailed(false);
            setConfirming(next);
            return;
          }
          setConfirming(null);
          commit(next);
        }}
        className="rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {confirming === SENDS_EMAIL && (
        <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-xl border border-destructive/40 bg-card p-3 shadow-lg">
          <p className="text-xs font-semibold text-foreground">
            Send the acceptance email?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This emails the person who submitted this enquiry to tell them they
            have been <strong>accepted</strong>. It cannot be unsent. If you are
            declining them, choose <strong>Closed</strong> instead — that emails
            nobody.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => commit(SENDS_EMAIL)}
              disabled={pending}
              aria-busy={pending}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              <BusyLabel pending={pending} busy="Sending…">
                Yes, accept &amp; email
              </BusyLabel>
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(null);
                setFailed(false);
              }}
              disabled={pending}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
          {failed && (
            <p className="mt-2 text-xs font-semibold text-destructive">
              Couldn&apos;t save that — nothing was sent. Try again.
            </p>
          )}
        </div>
      )}

      {failed && confirming === null && (
        <p className="mt-1 text-xs font-semibold text-destructive">
          Couldn&apos;t save that. Try again.
        </p>
      )}
    </div>
  );
}
