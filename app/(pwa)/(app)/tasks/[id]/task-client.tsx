"use client";

import {
  Camera,
  Check,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  FileText,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DocumentUpload } from "@/components/document-upload";
import { PageHeader } from "@/components/page-header";
import { BusyLabel } from "@/components/spinner";
import { useToast } from "@/components/toast";
import type { MenteeQuestion } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import {
  chooseEvidenceKind,
  submitTaskForReview,
  submitTest,
} from "../../dashboard/task-actions";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  stage: string | null;
  requiresEvidence: boolean;
  mentorName: string | null;
};

type Submission = {
  kind: string;
  testScore: number | null;
  testTotal: number | null;
  testPassed: boolean;
  photoFileName: string | null;
  pdfFileName: string | null;
  note: string | null;
} | null;

export function TaskClient({
  task,
  questions,
  submission,
}: {
  task: Task;
  questions: MenteeQuestion[];
  submission: Submission;
}) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<string | null>(submission?.kind ?? null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [testPassed, setTestPassed] = useState(submission?.testPassed ?? false);
  const [photoName, setPhotoName] = useState(submission?.photoFileName ?? null);
  const [pdfName, setPdfName] = useState(submission?.pdfFileName ?? null);
  const [note, setNote] = useState(submission?.note ?? "");
  const [pending, startTransition] = useTransition();

  const resolved = task.status === "completed" || task.status === "failed";
  const sent = task.status === "submitted";

  function pickKind(next: string) {
    setKind(next);
    // Switching route clears the other one's evidence server-side, so the
    // screen has to forget it too rather than keep showing a file that is
    // no longer attached to anything.
    if (next === "pdf") {
      setTestPassed(false);
      setPhotoName(null);
    } else {
      setPdfName(null);
    }
    startTransition(async () => {
      try {
        await chooseEvidenceKind(task.id, next);
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Couldn't save that",
          description: "Check you're online and try again.",
        });
      }
    });
  }

  function markTest() {
    startTransition(async () => {
      try {
        const result = await submitTest(task.id, answers);
        setTestPassed(result.passed);
        toast({
          variant: result.passed ? "success" : "error",
          title: result.passed
            ? `Passed — ${result.score}/${result.total}`
            : `Not yet — ${result.score}/${result.total}`,
          description: result.passed
            ? "Now add a photo of your work."
            : "Read the task again and have another go. You can retake it.",
        });
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Couldn't mark your test",
          description: "Check you're online and try again.",
        });
      }
    });
  }

  function send() {
    startTransition(async () => {
      try {
        const result = await submitTaskForReview(task.id, note);
        if (!result.ok) {
          toast({
            variant: "error",
            title: "Not ready to send yet",
            description: result.missing.join(" "),
          });
          return;
        }
        toast({
          title: "Sent to your mentor",
          description: `${task.mentorName ?? "Your mentor"} will review it and mark it complete.`,
        });
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Couldn't send that",
          description: "Check you're online and try again.",
        });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10">
      <PageHeader title={task.title} />

      <Link
        href="/dashboard"
        className="mb-4 mt-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to dashboard
      </Link>

      <h1 className="mb-2 font-display text-2xl font-black text-foreground lg:text-3xl">
        {task.title}
      </h1>

      {task.description && (
        <p className="mb-6 text-sm text-muted-foreground">{task.description}</p>
      )}

      {resolved && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Check className="size-4 text-primary" />
            {task.status === "completed"
              ? "Your mentor marked this complete."
              : "Your mentor closed this task."}
          </p>
        </div>
      )}

      {sent && (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-accent-ink" />
            Waiting for {task.mentorName ?? "your mentor"} to review it.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Only your mentor can mark a task complete.
          </p>
        </div>
      )}

      {!resolved && !sent && task.requiresEvidence && (
        <>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            How are you submitting this?
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Pick one. Either take the test and add a photo of your work, or
            upload the whole assignment as a PDF.
          </p>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <RouteCard
              active={kind === "test_and_photo"}
              disabled={pending}
              icon={ClipboardCheck}
              title="Test + photo"
              hint={
                questions.length > 0
                  ? `${questions.length} question${questions.length === 1 ? "" : "s"}, then a picture`
                  : "Your mentor hasn't added a test to this task"
              }
              onClick={() => pickKind("test_and_photo")}
            />
            <RouteCard
              active={kind === "pdf"}
              disabled={pending}
              icon={FileText}
              title="PDF assignment"
              hint="Upload your work as one PDF"
              onClick={() => pickKind("pdf")}
            />
          </div>

          {kind === "test_and_photo" && (
            <div className="space-y-5">
              {questions.length === 0 ? (
                <p className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
                  There's no test on this task yet. Ask your mentor to add one,
                  or submit a PDF instead.
                </p>
              ) : testPassed ? (
                <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-semibold text-foreground">
                  <Check className="size-4 text-primary" />
                  Test passed
                  {submission?.testScore != null &&
                    ` — ${submission.testScore}/${submission.testTotal}`}
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <fieldset
                      key={question.id}
                      className="rounded-2xl border border-border bg-card p-4"
                    >
                      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Question {index + 1}
                      </legend>
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        {question.prompt}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            // Keyed by position, not text: two answers on one
                            // question may legitimately read the same, and
                            // duplicate keys would make React reuse the wrong
                            // radio when the mentee picks one.
                            // biome-ignore lint/suspicious/noArrayIndexKey: options are a fixed positional list
                            key={optionIndex}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm text-foreground has-checked:border-primary has-checked:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={answers[question.id] === optionIndex}
                              onChange={() =>
                                setAnswers((a) => ({
                                  ...a,
                                  [question.id]: optionIndex,
                                }))
                              }
                              className="size-4 accent-primary"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    onClick={markTest}
                    disabled={
                      pending || Object.keys(answers).length < questions.length
                    }
                    aria-busy={pending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 px-6 py-3 text-sm font-semibold text-primary disabled:opacity-40"
                  >
                    <BusyLabel pending={pending} busy="Marking…">
                      Check my answers
                    </BusyLabel>
                  </button>
                </div>
              )}

              <DocumentUpload
                endpoint="taskEvidencePhoto"
                label="Photo of your work"
                hint="A picture, up to 8MB"
                icon={Camera}
                initialFileName={photoName}
                required
                uploadInput={{ taskId: task.id }}
                onUploaded={setPhotoName}
              />
            </div>
          )}

          {kind === "pdf" && (
            <DocumentUpload
              endpoint="taskEvidencePdf"
              label="Your assignment"
              hint="PDF only, 10MB at most"
              icon={FileText}
              initialFileName={pdfName}
              required
              uploadInput={{ taskId: task.id }}
              onUploaded={setPdfName}
            />
          )}

          {kind && (
            <div className="mt-6">
              <label
                htmlFor="task-note"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Anything you want to tell your mentor?
              </label>
              <textarea
                id="task-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional — what went well, what was hard."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={send}
                disabled={pending}
                aria-busy={pending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
              >
                <BusyLabel pending={pending} busy="Sending…">
                  <Send className="size-4" />
                  Send to my mentor
                </BusyLabel>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RouteCard({
  active,
  disabled,
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: React.ElementType;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border-2 p-4 text-left disabled:opacity-50",
        active ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
    >
      <Icon
        className={cn(
          "mb-2 size-6",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}
