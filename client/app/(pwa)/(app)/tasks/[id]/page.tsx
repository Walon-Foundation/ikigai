import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { mentorships, tasks, users } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { getMenteeQuestions, getSubmission } from "@/lib/tasks";
import { TaskClient } from "./task-client";

// The mentee's task screen: read the task, file the evidence, send it.
//
// A server component so the answer key never has a route to the browser —
// getMenteeQuestions() selects around taskQuestions.correctIndex, and this page
// is the only thing that calls it.
export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireRole(["mentee"]);

  // Joined to the mentorship rather than looked up by id: this resolves only
  // for a task belonging to a mentorship this mentee is in.
  const [task] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      stage: tasks.stage,
      requiresEvidence: tasks.requiresEvidence,
      dueDate: tasks.dueDate,
      mentorName: users.displayName,
    })
    .from(tasks)
    .innerJoin(
      mentorships,
      and(
        eq(tasks.mentorshipId, mentorships.id),
        eq(mentorships.menteeId, me.id),
      ),
    )
    .leftJoin(users, eq(mentorships.mentorId, users.id))
    .where(eq(tasks.id, id))
    .limit(1);

  if (!task) notFound();

  const [questions, submission] = await Promise.all([
    getMenteeQuestions(task.id),
    getSubmission(task.id),
  ]);

  return (
    <TaskClient
      task={{
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        stage: task.stage,
        requiresEvidence: task.requiresEvidence,
        mentorName: task.mentorName,
      }}
      questions={questions}
      submission={
        submission && {
          kind: submission.kind,
          testScore: submission.testScore,
          testTotal: submission.testTotal,
          testPassed: !!submission.testPassedAt,
          photoFileName: submission.photoFileName,
          pdfFileName: submission.pdfFileName,
          note: submission.note,
        }
      }
    />
  );
}
