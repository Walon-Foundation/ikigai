"use client";

import {
  Check,
  ExternalLink,
  FileText,
  ImageIcon,
  Plus,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { assignTask, completeTask, failTask } from "../actions";

export type TaskSubmissionView = {
  kind: string;
  testScore: number | null;
  testTotal: number | null;
  testPassed: boolean;
  photoFileName: string | null;
  photoUrl: string | null;
  pdfFileName: string | null;
  pdfUrl: string | null;
  note: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  stage: string | null;
  requiresEvidence: boolean;
  growthPoints: number;
  createdAt: string | null;
  submission: TaskSubmissionView | null;
};

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-accent-pale text-earth-ink",
  submitted: "bg-accent/20 text-earth-ink",
  completed: "bg-primary-muted/30 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

type DraftQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

const BLANK_QUESTION: DraftQuestion = {
  prompt: "",
  options: ["", ""],
  correctIndex: 0,
};

export function MenteeTasks({
  mentorshipId,
  initialTasks,
}: {
  mentorshipId: string;
  initialTasks: TaskItem[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    if (!title.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await assignTask({
          mentorshipId,
          title,
          description,
          stage,
          questions: questions.filter((q) => q.prompt.trim()),
        });
        setTitle("");
        setDescription("");
        setStage("");
        setQuestions([]);
        setShowForm(false);
      } catch {
        setError("Could not assign the task. Try again.");
      }
    });
  }

  function patchQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tasks
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-light"
        >
          <Plus className="size-3.5" /> Assign task
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-xl border border-border bg-background p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Advice or detail (optional)"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />

          <label
            htmlFor="task-stage"
            className="block text-xs font-semibold text-muted-foreground"
          >
            Which stage does this count towards?
          </label>
          <select
            id="task-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">
              No stage — doesn&apos;t count towards promotion
            </option>
            <option value="discover">Discover</option>
            <option value="thrive">Thrive</option>
            <option value="build">Build</option>
            <option value="lead">Lead</option>
          </select>

          {/* The test is the mentor's, written per task — that is what "total
              control of the curriculum" means here. It is optional: without it
              the mentee simply submits a PDF instead. */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">
              Test questions (optional)
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              If you add questions, your mentee can pass the test and send a
              photo instead of writing up a PDF. They need 70% to pass.
            </p>

            <div className="mt-3 space-y-3">
              {questions.map((question, index) => (
                <div
                  // Index-keyed on purpose: these rows have no id until they are
                  // saved, and their text is what the mentor is editing.
                  // biome-ignore lint/suspicious/noArrayIndexKey: draft rows have no stable id
                  key={index}
                  className="rounded-lg border border-border p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <input
                      value={question.prompt}
                      onChange={(e) =>
                        patchQuestion(index, { prompt: e.target.value })
                      }
                      placeholder={`Question ${index + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      aria-label={`Remove question ${index + 1}`}
                      onClick={() =>
                        setQuestions((qs) => qs.filter((_, i) => i !== index))
                      }
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {question.options.map((option, optionIndex) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: draft options have no stable id
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={question.correctIndex === optionIndex}
                          onChange={() =>
                            patchQuestion(index, { correctIndex: optionIndex })
                          }
                          aria-label={`Mark option ${optionIndex + 1} correct`}
                          className="size-3.5 shrink-0 accent-primary"
                        />
                        <input
                          value={option}
                          onChange={(e) =>
                            patchQuestion(index, {
                              options: question.options.map((o, i) =>
                                i === optionIndex ? e.target.value : o,
                              ),
                            })
                          }
                          placeholder={`Answer ${optionIndex + 1}`}
                          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                    {question.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() =>
                          patchQuestion(index, {
                            options: [...question.options, ""],
                          })
                        }
                        className="text-xs font-semibold text-primary"
                      >
                        + Another answer
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Select the radio next to the correct answer.
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setQuestions((qs) => [
                  ...qs,
                  { ...BLANK_QUESTION, options: ["", ""] },
                ])
              }
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus className="size-3.5" /> Add a question
            </button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!title.trim() || isPending}
              aria-busy={isPending}
              className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <BusyLabel pending={isPending} busy="Assigning…">
                Assign
              </BusyLabel>
            </button>
          </div>
        </div>
      )}

      {initialTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sprout className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No tasks yet. Assign one to grow their tree.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  // Complete and Mark failed act on the same task — track which one was
  // clicked so only that button spins instead of both.
  const [busyAction, setBusyAction] = useState<"complete" | "fail" | null>(
    null,
  );
  const isOpen = task.status === "assigned" || task.status === "submitted";

  function run(action: "complete" | "fail") {
    setBusyAction(action);
    startTransition(async () => {
      try {
        if (action === "complete") {
          const result = await completeTask(task.id);
          // The server refuses to complete a task with no evidence. Saying so
          // is the whole point — a silently ignored click would read as a bug.
          if (!result.ok) {
            toast({
              variant: "error",
              title: "No evidence yet",
              description: result.reason ?? "This task can't be completed yet.",
            });
          }
        } else {
          await failTask(task.id);
        }
      } catch {
        toast({
          variant: "error",
          title: "Couldn't save that",
          description: "Check you're online and try again.",
        });
      } finally {
        setBusyAction(null);
      }
    });
  }

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{task.title}</p>
          {task.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              STATUS_STYLES[task.status] ?? "bg-muted text-muted-foreground",
            )}
          >
            {task.status}
          </span>
          {task.stage && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
              {task.stage}
            </span>
          )}
        </div>
      </div>

      <Evidence task={task} />

      {isOpen && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            aria-busy={busyAction === "complete"}
            onClick={() => run("complete")}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <BusyLabel pending={busyAction === "complete"} busy="Completing…">
              <Check className="size-3.5" /> Complete
            </BusyLabel>
          </button>
          <button
            type="button"
            disabled={isPending}
            aria-busy={busyAction === "fail"}
            onClick={() => run("fail")}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-destructive/40 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
          >
            <BusyLabel pending={busyAction === "fail"} busy="Marking failed…">
              <X className="size-3.5" /> Mark failed
            </BusyLabel>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * What the mentee filed, and links to open it.
 *
 * Every link here is a short-lived signed URL minted on the server for this
 * render. There is no permanent URL for any of these files — they are stored
 * privately precisely because one of them is a photograph taken by a child.
 */
function Evidence({ task }: { task: TaskItem }) {
  if (!task.requiresEvidence) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        No evidence required on this task.
      </p>
    );
  }

  const submission = task.submission;
  if (!submission) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        Nothing submitted yet.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {submission.kind === "pdf" ? "PDF assignment" : "Test + photo"}
      </p>

      {submission.kind === "test_and_photo" && (
        <p
          className={cn(
            "mt-1.5 text-xs font-semibold",
            submission.testPassed ? "text-primary" : "text-muted-foreground",
          )}
        >
          {submission.testTotal
            ? `Test: ${submission.testScore}/${submission.testTotal} — ${
                submission.testPassed ? "passed" : "not passed"
              }`
            : "Test not taken yet"}
        </p>
      )}

      <div className="mt-2 space-y-1.5">
        <EvidenceLink
          icon={ImageIcon}
          label={submission.photoFileName}
          url={submission.photoUrl}
          hidden={submission.kind !== "test_and_photo"}
        />
        <EvidenceLink
          icon={FileText}
          label={submission.pdfFileName}
          url={submission.pdfUrl}
          hidden={submission.kind !== "pdf"}
        />
      </div>

      {submission.note && (
        <p className="mt-2 rounded-lg bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
          {submission.note}
        </p>
      )}
    </div>
  );
}

function EvidenceLink({
  icon: Icon,
  label,
  url,
  hidden,
}: {
  icon: React.ElementType;
  label: string | null;
  url: string | null;
  hidden: boolean;
}) {
  if (hidden) return null;
  if (!label) {
    return <p className="text-xs text-muted-foreground">Not uploaded yet.</p>;
  }
  if (!url) {
    // Distinguished from "not uploaded": the file exists, the link failed.
    return (
      <p className="text-xs font-semibold text-destructive">
        {label} — couldn&apos;t open this file, reload the page.
      </p>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-xs font-semibold text-primary"
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
