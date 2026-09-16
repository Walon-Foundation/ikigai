import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { DEFAULT_TASK_POINTS } from '../common/growth.js';
import type { SkillStage } from '../common/skill-stages.js';
import { SKILL_STAGES } from '../common/skill-stages.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  mentorships,
  taskQuestions,
  taskSubmissions,
  tasks,
} from '../db/schema.js';
import { applyTaskComplete, applyTaskFail } from '../growth/growth-tree.helpers.js';
import { dispatch } from '../notifications/internal/dispatch.js';
import {
  gradeTest,
  isEvidenceKind,
  isSubmissionComplete,
  missingEvidence,
} from './tasks.helpers.js';

const MAX_TASK_TITLE = 200;
const MAX_TASK_DESC = 2_000;
const MAX_NOTE = 1_000;
const MAX_QUESTIONS = 20;
const MAX_OPTIONS = 6;
const MAX_PROMPT = 500;
const MAX_OPTION = 200;

export type NewQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

@Injectable()
export class TasksService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  // ---- mentor side ------------------------------------------------------

  private async mentorshipForMentor(mentorshipId: string, mentorId: string) {
    const [m] = await this.db
      .select({ id: mentorships.id, menteeId: mentorships.menteeId })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.id, mentorshipId),
          eq(mentorships.mentorId, mentorId),
          eq(mentorships.status, 'active'),
        ),
      )
      .limit(1);
    if (!m) throw new BadRequestException('Mentorship not found');
    return m;
  }

  /** Load a task plus its mentee, asserting mentor ownership. */
  private async taskForMentor(taskId: string, mentorId: string) {
    const [row] = await this.db
      .select({
        id: tasks.id,
        // Carried so the mentee's notification can name the task rather than
        // saying "a task" — a mentee may have several open at once.
        title: tasks.title,
        status: tasks.status,
        requiresEvidence: tasks.requiresEvidence,
        growthPoints: tasks.growthPoints,
        menteeId: mentorships.menteeId,
      })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .where(and(eq(tasks.id, taskId), eq(mentorships.mentorId, mentorId)))
      .limit(1);
    if (!row) throw new BadRequestException('Task not found');
    return row;
  }

  /**
   * Assign a task, optionally with the on-platform test that evidences it.
   *
   * The mentor has total control of the curriculum, and that includes the test:
   * these questions are the mentor's, written per task, not drawn from a
   * central bank. Everything is bounded before storage — request arguments
   * arrive off a body, and `options` in particular is an arbitrary array that
   * ends up rendered to a mentee.
   */
  async assignTask(
    userId: string,
    input: {
      mentorshipId: string;
      title: string;
      description?: string;
      stage?: string | null;
      requiresEvidence?: boolean;
      questions?: NewQuestion[];
    },
  ) {
    const me = await this.actor.requireApprovedMentor(userId);
    const m = await this.mentorshipForMentor(input.mentorshipId, me.id);

    const title =
      typeof input.title === 'string'
        ? input.title.trim().slice(0, MAX_TASK_TITLE)
        : '';
    if (!title) throw new BadRequestException('Title is required');
    const description =
      typeof input.description === 'string'
        ? input.description.trim().slice(0, MAX_TASK_DESC)
        : '';

    const stage = SKILL_STAGES.includes(input.stage as SkillStage)
      ? (input.stage as SkillStage)
      : null;

    const [task] = await this.db
      .insert(tasks)
      .values({
        mentorshipId: m.id,
        title,
        description: description || null,
        stage,
        requiresEvidence: input.requiresEvidence !== false,
        growthPoints: DEFAULT_TASK_POINTS,
      })
      .returning({ id: tasks.id });

    if (m.menteeId) {
      await dispatch({
        key: 'TASK_ASSIGNED',
        to: m.menteeId,
        vars: { task: title, taskId: task.id },
        dedupe: task.id,
      });
    }

    const questions = cleanQuestions(input.questions);
    if (questions.length > 0) {
      await this.db.insert(taskQuestions).values(
        questions.map((q, index) => ({
          taskId: task.id,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          orderIndex: index,
        })),
      );
    }

    return { taskId: task.id };
  }

  /**
   * The mentor marks a task complete. Only the mentor reaches this.
   *
   * Refused unless the evidence bundle is actually complete — a passed test AND
   * a photo, or a PDF. The gate is here rather than only on the screen because
   * the screen is not what enforces it: this is a public endpoint, and a task
   * completed without evidence counts towards stage promotion just the same.
   */
  async completeTask(userId: string, taskId: string) {
    const me = await this.actor.requireApprovedMentor(userId);
    const task = await this.taskForMentor(taskId, me.id);
    if (task.status === 'completed' || task.status === 'failed') {
      return { ok: true }; // already resolved
    }

    if (task.requiresEvidence) {
      const [submission] = await this.db
        .select()
        .from(taskSubmissions)
        .where(eq(taskSubmissions.taskId, task.id))
        .limit(1);
      if (!isSubmissionComplete(submission)) {
        return {
          ok: false,
          reason:
            'This task has no complete evidence yet. Your mentee needs to pass the test and add a photo, or upload a PDF.',
        };
      }
    }

    await this.db
      .update(tasks)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(tasks.id, taskId));

    if (task.menteeId) {
      await applyTaskComplete(task.menteeId, task.growthPoints);
      await dispatch({
        key: 'TASK_COMPLETED',
        to: task.menteeId,
        vars: { task: task.title },
        dedupe: `${taskId}:completed`,
      });
    }
    return { ok: true };
  }

  async failTask(userId: string, taskId: string) {
    const me = await this.actor.requireApprovedMentor(userId);
    const task = await this.taskForMentor(taskId, me.id);
    if (task.status === 'completed' || task.status === 'failed') {
      return { ok: true };
    }

    await this.db
      .update(tasks)
      .set({ status: 'failed', failedAt: new Date() })
      .where(eq(tasks.id, taskId));

    if (task.menteeId) {
      await applyTaskFail(task.menteeId);
      await dispatch({
        key: 'TASK_FAILED',
        to: task.menteeId,
        vars: { task: task.title, taskId },
        dedupe: `${taskId}:failed`,
      });
    }
    return { ok: true };
  }

  // ---- mentee side ------------------------------------------------------

  /**
   * A task belonging to a mentorship this mentee is actually in.
   *
   * There is deliberately no mentee "complete my task" path anywhere. That
   * action once existed and moved a task straight to 'completed', awarding its
   * growth points — the hole in the rule that only a mentor presses complete.
   * Deleting the button would have left the endpoint, so the endpoint went too.
   * Nothing a mentee can call moves a task past 'submitted'.
   */
  private async ownTask(taskId: string, menteeId: string) {
    const [row] = await this.db
      .select({
        id: tasks.id,
        status: tasks.status,
        requiresEvidence: tasks.requiresEvidence,
        mentorshipId: tasks.mentorshipId,
        mentorId: mentorships.mentorId,
      })
      .from(tasks)
      .innerJoin(
        mentorships,
        and(
          eq(tasks.mentorshipId, mentorships.id),
          eq(mentorships.menteeId, menteeId),
        ),
      )
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!row) throw new BadRequestException('Task not found');
    return row;
  }

  /**
   * Pull a task back out of review when its evidence changes.
   *
   * Without this, a mentee could rewrite their submission — or wipe it, since
   * switching kind clears the other kind's fields — while the task still read
   * 'submitted' and their mentor was looking at it. The mentor would then be
   * reviewing something that no longer exists, and pressing Complete would be
   * refused with no explanation the mentee ever sees.
   *
   * Reverting to 'assigned' keeps one property true: a task in review is a task
   * whose evidence is not moving.
   */
  private async reopenIfSubmitted(task: { id: string; status: string }) {
    if (task.status !== 'submitted') return;
    await this.db
      .update(tasks)
      .set({ status: 'assigned', submittedAt: null })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, 'submitted')));
  }

  /**
   * Choose how to evidence a task: the on-platform test plus a photo, or a PDF.
   *
   * Switching kind clears the other kind's fields — a mentee who passed the
   * test, then changed their mind and uploaded a PDF, must not end up with a
   * row that looks half-complete under both rules at once.
   */
  async chooseEvidenceKind(userId: string, taskId: string, kind: string) {
    const me = await this.actor.requireRole(userId, ['mentee']);
    if (!isEvidenceKind(kind)) {
      throw new BadRequestException('Invalid submission type');
    }
    const task = await this.ownTask(taskId, me.id);
    if (task.status === 'completed' || task.status === 'failed') {
      return { ok: true };
    }

    await this.reopenIfSubmitted(task);

    await this.db
      .insert(taskSubmissions)
      .values({ taskId: task.id, menteeId: me.id, kind })
      .onConflictDoUpdate({
        target: taskSubmissions.taskId,
        set: {
          kind,
          testScore: null,
          testTotal: null,
          testPassedAt: null,
          photoFileKey: null,
          photoFileName: null,
          pdfFileKey: null,
          pdfFileName: null,
          submittedAt: new Date(),
        },
      });

    return { ok: true };
  }

  /**
   * Answer the task's test.
   *
   * `answers` is question id → chosen option index. Grading happens against the
   * stored key: the answer key is never sent to the client, and this never
   * accepts a score from the caller — only the choices, which it marks itself.
   */
  async submitTest(
    userId: string,
    taskId: string,
    answers: Record<string, number>,
  ) {
    const me = await this.actor.requireRole(userId, ['mentee']);
    const task = await this.ownTask(taskId, me.id);
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException('This task is already resolved');
    }

    // Coerce the untrusted map to question-id → integer before it is used.
    const clean: Record<string, number> = {};
    if (answers && typeof answers === 'object') {
      for (const [id, choice] of Object.entries(answers)) {
        if (typeof id === 'string' && Number.isInteger(choice)) {
          clean[id] = choice as number;
        }
      }
    }

    const result = await gradeTest(task.id, clean);
    if (result.total === 0) throw new BadRequestException('This task has no test');

    await this.reopenIfSubmitted(task);

    await this.db
      .insert(taskSubmissions)
      .values({
        taskId: task.id,
        menteeId: me.id,
        kind: 'test_and_photo',
        testScore: result.score,
        testTotal: result.total,
        testPassedAt: result.passed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: taskSubmissions.taskId,
        set: {
          kind: 'test_and_photo',
          testScore: result.score,
          testTotal: result.total,
          // Cleared on a failed retake, so a pass cannot be banked and kept
          // while the mentee's later attempts get worse.
          testPassedAt: result.passed ? new Date() : null,
        },
      });

    return result;
  }

  /**
   * Send the task to the mentor for review.
   *
   * Refuses unless the evidence bundle is complete — the same
   * isSubmissionComplete the mentor's complete button reads, so the two screens
   * cannot disagree about whether this task is ready.
   */
  async submitForReview(userId: string, taskId: string, note?: string) {
    const me = await this.actor.requireRole(userId, ['mentee']);
    const task = await this.ownTask(taskId, me.id);
    if (task.status !== 'assigned') return { ok: false, missing: [] };

    const [submission] = await this.db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, task.id))
      .limit(1);

    if (task.requiresEvidence && !isSubmissionComplete(submission)) {
      return { ok: false, missing: missingEvidence(submission) };
    }

    const trimmed =
      typeof note === 'string' ? note.trim().slice(0, MAX_NOTE) || null : null;
    if (submission && trimmed) {
      await this.db
        .update(taskSubmissions)
        .set({ note: trimmed, submittedAt: new Date() })
        .where(eq(taskSubmissions.taskId, task.id));
    }

    await this.db
      .update(tasks)
      .set({ status: 'submitted', submittedAt: new Date() })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, 'assigned')));

    if (task.mentorId) {
      await dispatch({ key: 'TASK_SUBMITTED', to: task.mentorId });
    }

    return { ok: true, missing: [] };
  }
}

/**
 * Bound and drop malformed test questions.
 *
 * Silently discarding a bad question rather than throwing is deliberate: these
 * arrive as a batch from a form where a mentor may have left a half-typed row
 * behind, and failing the whole assignment over it would lose the task too. A
 * question needs a prompt, at least two non-empty options, and a correctIndex
 * that actually points at one of them — anything else is not a question.
 */
function cleanQuestions(input: NewQuestion[] | undefined): NewQuestion[] {
  if (!Array.isArray(input)) return [];
  const cleaned: NewQuestion[] = [];
  for (const raw of input.slice(0, MAX_QUESTIONS)) {
    if (!raw || typeof raw !== 'object') continue;
    const prompt =
      typeof raw.prompt === 'string'
        ? raw.prompt.trim().slice(0, MAX_PROMPT)
        : '';
    if (!prompt) continue;
    const options = Array.isArray(raw.options)
      ? raw.options
          .filter((o): o is string => typeof o === 'string')
          .map((o) => o.trim().slice(0, MAX_OPTION))
          .filter(Boolean)
          .slice(0, MAX_OPTIONS)
      : [];
    if (options.length < 2) continue;
    const correctIndex = Number(raw.correctIndex);
    if (!Number.isInteger(correctIndex)) continue;
    if (correctIndex < 0 || correctIndex >= options.length) continue;
    cleaned.push({ prompt, options, correctIndex });
  }
  return cleaned;
}
