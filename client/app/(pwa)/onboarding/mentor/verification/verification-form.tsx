"use client";

import { FileText, IdCard } from "lucide-react";
import { useState, useTransition } from "react";
import { DocumentUpload } from "@/components/document-upload";
import { BusyLabel } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { MAX_PERSONAL_STATEMENT } from "@/lib/constants";
import { DOCUMENT_LIMITS, maxSizeLabel } from "@/lib/uploads";
import { type RequiredDocument, submitMentorVerification } from "../../actions";

const CV = DOCUMENT_LIMITS.mentorCv;
const GOVERNMENT_ID = DOCUMENT_LIMITS.governmentId;

const DOCUMENT_NAMES: Record<RequiredDocument, string> = {
  government_id: "government ID",
  cv: "CV",
};

/** "your CV" / "your government ID and your CV" */
function nameList(kinds: RequiredDocument[]): string {
  const names = kinds.map((k) => `your ${DOCUMENT_NAMES[k]}`);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

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
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Bumped to remount the upload fields when the server tells us a document it
  // was showing as accepted is not actually on file. Their "uploaded" state is
  // internal, so without a remount the screen keeps contradicting the server.
  const [fieldsKey, setFieldsKey] = useState(0);

  const statementLeft = MAX_PERSONAL_STATEMENT - statement.length;

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

    startTransition(async () => {
      try {
        const refusal = await submitMentorVerification(statement);

        // The server found a document missing that this screen believed was
        // uploaded — so the upload's server callback never landed and there is
        // no row behind the tick. Say so plainly, and correct the screen, or
        // the applicant re-presses Submit on a form that cannot ever accept it.
        if (refusal) {
          for (const kind of refusal.missing) {
            if (kind === "government_id") setIdName(null);
            if (kind === "cv") setCvName(null);
          }
          setFieldsKey((k) => k + 1);
          toast({
            variant: "error",
            title:
              refusal.missing.length > 1
                ? "Neither document was saved"
                : `Your ${DOCUMENT_NAMES[refusal.missing[0]]} wasn't saved`,
            description: `We don't have ${nameList(refusal.missing)} on file. If you just uploaded ${refusal.missing.length > 1 ? "them" : "it"}, the upload didn't finish — try again and wait for the green tick before submitting.`,
          });
        }
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
        // Anything genuinely unexpected. Next redacts the message in
        // production, so there is nothing specific to show — but the applicant
        // still needs to know their statement survived and what to do next.
        console.error("mentor verification: submit failed", error);
        toast({
          variant: "error",
          title: "Couldn't submit your application",
          description:
            "We couldn't reach the server. Your statement is still here — check your connection and press Submit again.",
        });
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
          key={`government-id-${fieldsKey}`}
          endpoint="governmentId"
          label="Government ID"
          hint={`National ID, passport, or driver's licence — PDF or photo, ${maxSizeLabel(GOVERNMENT_ID)} at most`}
          icon={IdCard}
          initialFileName={idName}
          required
          onUploaded={setIdName}
        />

        <DocumentUpload
          key={`mentor-cv-${fieldsKey}`}
          endpoint="mentorCv"
          label="CV / Resume"
          hint={`PDF only, ${maxSizeLabel(CV)} at most`}
          icon={FileText}
          initialFileName={cvName}
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
            // The server clamps to the same number. Enforcing it here too is
            // what stops an applicant writing past the limit and losing the end
            // of their answer on submit without ever being told.
            maxLength={MAX_PERSONAL_STATEMENT}
            aria-describedby="personal-statement-help"
            placeholder="Why do you want to mentor young people? What do you hope to contribute?"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
          <div
            id="personal-statement-help"
            className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
          >
            <p className="text-xs text-muted-foreground">
              Our team reads this when reviewing your application.
            </p>
            <p
              className={`text-xs tabular-nums ${
                statementLeft === 0
                  ? "font-semibold text-earth-ink"
                  : "text-muted-foreground"
              }`}
              // Announced only as it starts to matter, so a screen reader is
              // not reading a counter out on every keystroke.
              aria-live={statementLeft <= 100 ? "polite" : "off"}
            >
              {statementLeft === 0
                ? "Limit reached — 2,000 characters"
                : `${statement.length.toLocaleString()} / ${MAX_PERSONAL_STATEMENT.toLocaleString()}`}
            </p>
          </div>
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
    </div>
  );
}
