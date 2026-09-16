import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { taskQuestions, taskSubmissions } from "@/db/schema";

// The evidence rule, and the on-platform test behind half of it.
//
// The programme accepts exactly two kinds of evidence for a task:
//
//   test_and_photo — pass the task's test AND attach a photo of the work
//   pdf            — submit the assignment as a PDF
//
// AND, not OR, inside the first one: a passed test with no photo is not
// evidence that anything was done, and a photo with no test is not evidence
// that anything was understood. isSubmissionComplete() is the single place
// that decides, so the mentee's submit button, the mentor's complete button
// and the mentor's screen all answer the question the same way.

export type EvidenceKind = "test_and_photo" | "pdf";

export const EVIDENCE_KINDS: EvidenceKind[] = ["test_and_photo", "pdf"];

/** Share of a test's questions that must be right to count as passed. */
export const TEST_PASS_RATIO = 0.7;

export function isEvidenceKind(value: unknown): value is EvidenceKind {
  return (
    typeof value === "string" && EVIDENCE_KINDS.includes(value as EvidenceKind)
  );
}

type SubmissionShape = {
  kind: string;
  testPassedAt: Date | null;
  photoFileKey: string | null;
  pdfFileKey: string | null;
};

/** Whether a stored submission actually satisfies the kind it claims. */
export function isSubmissionComplete(
  submission: SubmissionShape | null | undefined,
): boolean {
  if (!submission) return false;
  if (submission.kind === "pdf") return !!submission.pdfFileKey;
  if (submission.kind === "test_and_photo") {
    return !!submission.testPassedAt && !!submission.photoFileKey;
  }
  return false;
}

/** What is still outstanding on a submission, for the mentee's screen. */
export function missingEvidence(
  submission: SubmissionShape | null | undefined,
): string[] {
  if (!submission) return ["Choose how you want to submit this task."];
  if (submission.kind === "pdf") {
    return submission.pdfFileKey ? [] : ["Upload your assignment as a PDF."];
  }
  if (submission.kind === "test_and_photo") {
    const missing: string[] = [];
    if (!submission.testPassedAt) missing.push("Pass the task test.");
    if (!submission.photoFileKey) missing.push("Add a photo of your work.");
    return missing;
  }
  return ["Choose how you want to submit this task."];
}

export type MenteeQuestion = {
  id: string;
  prompt: string;
  options: string[];
  orderIndex: number;
};

/**
 * A task's test questions WITHOUT the answer key.
 *
 * The only read of taskQuestions that a mentee's request may reach. The column
 * list is the security boundary: `correctIndex` sits on the same row, and a
 * `select()` with no arguments would serialize it into the page for anyone who
 * opened dev tools.
 */
export async function getMenteeQuestions(
  taskId: string,
): Promise<MenteeQuestion[]> {
  return db
    .select({
      id: taskQuestions.id,
      prompt: taskQuestions.prompt,
      options: taskQuestions.options,
      orderIndex: taskQuestions.orderIndex,
    })
    .from(taskQuestions)
    .where(eq(taskQuestions.taskId, taskId))
    .orderBy(asc(taskQuestions.orderIndex));
}

export type GradeResult = {
  score: number;
  total: number;
  passed: boolean;
};

/**
 * Grade a submitted set of answers.
 *
 * Grading is server-side and the answer key never leaves it, so a mentee
 * cannot read the answers out of the page or post a score of their own —
 * `answers` is a map of question id to chosen option index, and the score is
 * computed here from the stored key.
 */
export async function gradeTest(
  taskId: string,
  answers: Record<string, number>,
): Promise<GradeResult> {
  const key = await db
    .select({
      id: taskQuestions.id,
      correctIndex: taskQuestions.correctIndex,
    })
    .from(taskQuestions)
    .where(eq(taskQuestions.taskId, taskId));

  if (key.length === 0) return { score: 0, total: 0, passed: false };

  let score = 0;
  for (const question of key) {
    if (answers[question.id] === question.correctIndex) score += 1;
  }

  return {
    score,
    total: key.length,
    passed: score / key.length >= TEST_PASS_RATIO,
  };
}

/** The submission on a task, or null. */
export async function getSubmission(taskId: string) {
  const [row] = await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.taskId, taskId))
    .limit(1);
  return row ?? null;
}
