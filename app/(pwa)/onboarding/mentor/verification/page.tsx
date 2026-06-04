"use client";

import { FileText, IdCard, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { submitMentorVerification } from "../../actions";

export default function MentorVerificationPage() {
  const [isPending, startTransition] = useTransition();

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
        <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border p-5">
          <IdCard className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">Government ID</p>
            <p className="text-sm text-muted-foreground">
              National ID, passport, or driver&apos;s licence
            </p>
            <p className="mt-1 text-xs text-primary">
              File upload coming soon — our team will contact you via email
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border p-5">
          <FileText className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">CV / Resume</p>
            <p className="text-sm text-muted-foreground">
              PDF or Word document
            </p>
            <p className="mt-1 text-xs text-primary">
              File upload coming soon — our team will contact you via email
            </p>
          </div>
        </div>

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
            placeholder="Why do you want to mentor young people? What do you hope to contribute?"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => submitMentorVerification())}
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Submit Application"
        )}
      </button>
    </div>
  );
}
