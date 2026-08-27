"use client";

import { FileText, IdCard } from "lucide-react";
import { useState, useTransition } from "react";
import { DocumentUpload } from "@/components/document-upload";
import { BusyLabel } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { DOCUMENT_LIMITS, maxSizeLabel } from "@/lib/uploads";
import { submitMentorVerification } from "../../actions";

const CV = DOCUMENT_LIMITS.mentorCv;
const GOVERNMENT_ID = DOCUMENT_LIMITS.governmentId;

export function VerificationForm({
  initialGovernmentId,
  initialCv,
}: {
  initialGovernmentId: string | null;
  initialCv: string | null;
}) {
  const [statement, setStatement] = useState("");
  const [cvName, setCvName] = useState<string | null>(initialCv);
  const [idName, setIdName] = useState<string | null>(initialGovernmentId);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function submit() {
    // Neither document is optional: the admin team is deciding whether to put
    // this adult in front of a child, and it cannot do that on a CV with no
    // identity behind it, or on an ID with no history behind it.
    //
    // The button stays enabled and says which document is missing — a
    // greyed-out Submit with no explanation leaves the applicant guessing at
    // which field is at fault. Both are named in one message when both are
    // missing, so nobody uploads one, retries, and is stopped again.
    const missing = [
      !idName &&
        `your government ID (a PDF or a photo, ${maxSizeLabel(GOVERNMENT_ID)} at most)`,
      !cvName && `your CV as a PDF (${maxSizeLabel(CV)} at most)`,
    ].filter((m): m is string => Boolean(m));

    if (missing.length > 0) {
      toast({
        variant: "error",
        title:
          missing.length > 1
            ? "Two documents are still missing"
            : "One document is still missing",
        description: `Upload ${missing.join(" and ")} before submitting your application.`,
      });
      return;
    }

    setFailed(false);
    startTransition(async () => {
      try {
        await submitMentorVerification(statement);
      } catch (error) {
        // A successful submit ends in redirect(), which throws to unwind — that
        // is not a failure and must not be reported as one.
        if (
          error &&
          typeof error === "object" &&
          "digest" in error &&
          typeof error.digest === "string" &&
          error.digest.startsWith("NEXT_REDIRECT")
        ) {
          throw error;
        }
        setFailed(true);
      }
    });
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Identity verification
      </h2>
      <p className="mb-2 text-muted-foreground">
        We verify all mentors to keep the platform safe. This is reviewed by our
        admin team within 48 hours.
      </p>

      <div className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">What happens next</p>
        <p className="mt-1">
          After you submit, your profile is created. You can explore the
          platform but cannot be matched with mentees until our team approves
          your application.
        </p>
      </div>

      <div className="space-y-4">
        <DocumentUpload
          endpoint="governmentId"
          label="Government ID"
          hint={`National ID, passport, or driver's licence — PDF or photo, ${maxSizeLabel(GOVERNMENT_ID)} at most`}
          icon={IdCard}
          initialFileName={initialGovernmentId}
          required
          onUploaded={setIdName}
        />

        <DocumentUpload
          endpoint="mentorCv"
          label="CV / Resume"
          hint={`PDF only, ${maxSizeLabel(CV)} at most`}
          icon={FileText}
          initialFileName={initialCv}
          required
          onUploaded={setCvName}
        />

        <p className="text-xs text-muted-foreground">
          Both documents are required. They go straight to our storage provider
          and are only used to review your application.
        </p>

        <div>
          <label
            htmlFor="personal-statement"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Personal statement
          </label>
          <textarea
            id="personal-statement"
            rows={4}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Why do you want to mentor young people? What do you hope to contribute?"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Our team reads this when reviewing your application.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        aria-busy={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        <BusyLabel pending={isPending} busy="Submitting…">
          Submit Application
        </BusyLabel>
      </button>
      {failed && (
        <p className="mt-2 text-center text-sm font-semibold text-destructive">
          Couldn&apos;t submit — your statement is still here, try again.
        </p>
      )}
    </div>
  );
}
