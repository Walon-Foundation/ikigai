"use client";

import { FileText, IdCard } from "lucide-react";
import { useState, useTransition } from "react";
import { DocumentUpload } from "@/components/document-upload";
import { BusyLabel } from "@/components/spinner";
import { submitMentorVerification } from "../../actions";

export default function MentorVerificationPage() {
  const [statement, setStatement] = useState("");
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
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
          hint="National ID, passport, or driver's licence"
          icon={IdCard}
        />

        <DocumentUpload
          endpoint="mentorCv"
          label="CV / Resume"
          hint="PDF or image, up to 8MB"
          icon={FileText}
        />

        <p className="text-xs text-muted-foreground">
          Your documents are uploaded straight to our storage provider and are
          only ever readable by the ikigai team reviewing your application.
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
