"use client";

import { Lock, Send, Shield } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { submitSafetyReport } from "./actions";

// The only interactive part of the Safety page. Split out so the crisis banner
// and the helpline list — which are static, and are the things someone in
// trouble actually needs to reach — render as plain server-rendered HTML
// instead of waiting on this form's JavaScript.
export function ReportForm() {
  const [reportType, setReportType] = useState<"inappropriate" | "concern">(
    "inappropriate",
  );
  const [reportNotes, setReportNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submitReport() {
    if (!reportNotes.trim()) return;
    setFailed(false);
    startTransition(async () => {
      try {
        await submitSafetyReport({ type: reportType, notes: reportNotes });
        setSubmitted(true);
        setReportNotes("");
      } catch {
        // A safety report that fails must say so. Previously the throw was
        // unhandled: the button simply returned to its resting state and the
        // person was left to guess whether anyone had been told.
        setFailed(true);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* This card used to be headed "Anonymous Report" and promised twice that
          the sender's identity would never be revealed. That was not true:
          submitSafetyReport() stores reporterId, and the admin report queue
          renders "Reported by {displayName}". Telling a child their report is
          anonymous and then attaching their name to it is the worst possible
          version of this screen — it either breaks trust at the moment they
          most need it, or it stops them reporting at all once they find out.
          The identity is deliberately kept (the safeguarding team has to be
          able to reach a child who reports abuse, and a report no one can
          follow up on helps no one), so the copy below tells the truth about
          it instead: who sees the name, why, and — the thing that actually
          worries a young person — that the person being reported never does. */}
      <div className="mb-4 flex items-center gap-2">
        <Shield className="size-5 text-primary" />
        <p className="font-semibold text-foreground">Report a problem</p>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Tell us about behaviour that felt wrong or unsafe — something someone
        said or did, or a worry you have about a friend. Our safeguarding team
        reads every report and will take it seriously.
      </p>

      {submitted ? (
        <div className="rounded-xl border border-primary-muted/40 bg-primary-muted/10 p-4 text-center">
          <p className="font-semibold text-primary">Report submitted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Our safeguarding team will read it within 24 hours, and someone may
            message you to check how you are. If you need to talk to somebody
            right now, the helplines above are open.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            {(["inappropriate", "concern"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-all ${
                  reportType === type
                    ? "border-primary bg-primary-muted/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {type === "inappropriate" ? "Inappropriate" : "Safety Concern"}
              </button>
            ))}
          </div>
          <textarea
            value={reportNotes}
            onChange={(e) => setReportNotes(e.target.value)}
            placeholder="Describe what happened..."
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="mt-3 flex items-start gap-2">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Your name is sent with this report so our safeguarding team can
              check that you are okay and get back to you. Only that small team
              can see it — the person you are reporting is never told who
              reported them.
            </p>
          </div>
          <button
            type="button"
            onClick={submitReport}
            disabled={!reportNotes.trim() || isPending}
            aria-busy={isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-earth py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            <BusyLabel pending={isPending} busy="Submitting…">
              <Send className="size-4" />
              Submit Report
            </BusyLabel>
          </button>
          {failed && (
            <p className="mt-2 text-center text-sm font-semibold text-destructive">
              Couldn&apos;t send your report — it has not reached our team. Your
              text is still here. If this is urgent, use a helpline above.
            </p>
          )}
        </>
      )}
    </div>
  );
}
