"use client";

import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Phone,
  Send,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { SAFETY_RESOURCES } from "@/lib/constants";
import { awardSafetyMilestone, submitSafetyReport } from "./actions";

export default function SafetyPage() {
  const [reportType, setReportType] = useState<"inappropriate" | "concern">(
    "inappropriate",
  );
  const [reportNotes, setReportNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    awardSafetyMilestone();
  }, []);

  function submitReport() {
    if (!reportNotes.trim()) return;
    startTransition(async () => {
      await submitSafetyReport({ type: reportType, notes: reportNotes });
      setSubmitted(true);
      setReportNotes("");
    });
  }

  return (
    <>
      <PageHeader title="Safety" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Crisis banner */}
        <Link
          href="/safety/help"
          className="mb-6 flex items-center justify-between rounded-2xl bg-earth p-5 text-white"
        >
          <div className="flex items-center gap-3">
            <Phone className="size-6 text-earth-light" />
            <div>
              <p className="font-semibold">Need immediate help?</p>
              <p className="text-sm text-earth-light">
                View crisis helplines — always available
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-earth-light" />
        </Link>

        {/* Safety resources */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Helplines
          </p>
          <div className="space-y-3">
            {SAFETY_RESOURCES.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-muted/30">
                  <Phone className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <a
                  href={`tel:${r.phone.replace(/\s/g, "")}`}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Anonymous Report */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <p className="font-semibold text-foreground">Anonymous Report</p>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Report inappropriate behaviour or safety concerns. Your identity
            remains anonymous. Our admin team reviews every report.
          </p>

          {submitted ? (
            <div className="rounded-xl border border-primary-muted/40 bg-primary-muted/10 p-4 text-center">
              <p className="font-semibold text-primary">Report submitted</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our team will review your report within 24 hours.
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
                    {type === "inappropriate"
                      ? "Inappropriate"
                      : "Safety Concern"}
                  </button>
                ))}
              </div>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Describe what happened..."
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
              />
              <div className="mt-3 flex items-center gap-2">
                <AlertTriangle className="size-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Your identity will not be revealed.
                </p>
              </div>
              <button
                type="button"
                onClick={submitReport}
                disabled={!reportNotes.trim() || isPending}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-earth py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {isPending ? "Submitting…" : "Submit Report"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
