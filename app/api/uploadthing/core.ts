import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";
import { db } from "@/db/db";
import {
  mentorDocuments,
  mentorships,
  taskSubmissions,
  tasks,
  users,
} from "@/db/schema";
import { DOCUMENT_LIMITS } from "@/lib/uploads";

const f = createUploadthing();
const utapi = new UTApi();

// The file bytes never pass through this backend — the browser uploads them
// directly to UploadThing's storage. These server-side middlewares only run to
// authenticate the Clerk user and authorize the upload; onUploadComplete then
// receives the stored file's metadata (a key and a URL, not the bytes) and
// persists it.

/** Authenticate, and confirm the caller is a mentor. */
async function requireMentorUpload() {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) throw new UploadThingError("Unauthorized");
  if (user.role !== "mentor") throw new UploadThingError("Forbidden");
  return { userId: user.id };
}

/** Authenticate, and confirm the caller is an admin. */
async function requireAdminUpload() {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) throw new UploadThingError("Unauthorized");
  if (user.role !== "admin") throw new UploadThingError("Forbidden");
  return { userId: user.id };
}

/**
 * Store a vetting document, and make it private.
 *
 * This app's default ACL has to stay public-read because avatars are rendered
 * straight from their URLs, so a document lands public and is flipped to
 * private here, immediately after upload. If that flip fails the file is
 * deleted rather than left readable at a public URL: losing an upload is
 * recoverable — the applicant uploads it again — whereas a government ID
 * sitting permanently at a public link is not.
 *
 * Only the key is stored. There is no working URL for a private file, so the
 * admin screen mints a short-lived signed one at view time.
 */
async function storeDocument(
  userId: string,
  kind: "government_id" | "cv",
  file: { key: string; name: string },
) {
  try {
    await utapi.updateACL(file.key, "private");
  } catch (err) {
    await utapi.deleteFiles(file.key).catch(() => {});
    console.error("uploadthing: could not make document private", err);
    throw new UploadThingError("Upload failed");
  }

  // One document per kind per mentor: a re-upload replaces the previous file of
  // THIS kind rather than stacking, and the old object is removed from storage
  // instead of being orphaned there forever.
  //
  // Scoped to (userId, kind), not userId alone — matching on the user would
  // make uploading a CV delete the government ID, and take its file with it.
  const mine = and(
    eq(mentorDocuments.userId, userId),
    eq(mentorDocuments.kind, kind),
  );

  const previous = await db
    .select({ fileKey: mentorDocuments.fileKey })
    .from(mentorDocuments)
    .where(mine);
  const stale = previous
    .filter((p) => p.fileKey !== file.key)
    .map((p) => p.fileKey);

  await db
    .delete(mentorDocuments)
    .where(mine)
    .catch(() => {});

  await db.insert(mentorDocuments).values({
    userId,
    kind,
    fileKey: file.key,
    fileName: file.name,
  });

  if (stale.length > 0) await utapi.deleteFiles(stale).catch(() => {});

  return { uploaded: true as const };
}

// UploadThing types `maxFileSize` as a power-of-two literal, but its own
// parser (fileSizeToBytes in @uploadthing/shared) accepts any number and unit,
// and 10MB is the number this product promises the applicant. Rounding it up
// to the nearest typeable value would leave the server accepting files the
// screen says it will not — a cap that only the browser enforces is not a cap.
type FileSizeLiteral = "8MB";
const GOVERNMENT_ID_MAX = DOCUMENT_LIMITS.governmentId
  .maxFileSize as FileSizeLiteral;
const MENTOR_CV_MAX = DOCUMENT_LIMITS.mentorCv.maxFileSize as FileSizeLiteral;
const TASK_PHOTO_MAX = DOCUMENT_LIMITS.taskEvidencePhoto
  .maxFileSize as FileSizeLiteral;
const TASK_PDF_MAX = DOCUMENT_LIMITS.taskEvidencePdf
  .maxFileSize as FileSizeLiteral;

/**
 * Authenticate a mentee and confirm they own an unresolved task.
 *
 * Takes the task id as UploadThing input rather than trusting the client to
 * say who it is uploading for: without this join, any signed-in mentee could
 * attach a file to any task on the platform, including another mentee's.
 */
async function requireOwnOpenTask(taskId: string) {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");

  const [me] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new UploadThingError("Unauthorized");
  if (me.role !== "mentee") throw new UploadThingError("Forbidden");

  const [task] = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .innerJoin(
      mentorships,
      and(
        eq(tasks.mentorshipId, mentorships.id),
        eq(mentorships.menteeId, me.id),
      ),
    )
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!task) throw new UploadThingError("Forbidden");
  // A completed or failed task is decided; new evidence cannot be filed
  // against it, and letting one in would let a mentee overwrite the record
  // their mentor already ruled on.
  if (task.status === "completed" || task.status === "failed") {
    throw new UploadThingError("This task is already resolved");
  }

  return { menteeId: me.id, taskId: task.id };
}

/**
 * Store a piece of task evidence against its submission, privately.
 *
 * Same private-ACL discipline as the vetting documents above, and for a
 * stronger reason: this is a photograph taken by a child, and a permanent
 * public URL for it is not something this platform should ever mint. If the
 * ACL flip fails the file is deleted rather than left readable.
 */
async function storeEvidence(
  meta: { menteeId: string; taskId: string },
  column: "photo" | "pdf",
  file: { key: string; name: string },
) {
  try {
    await utapi.updateACL(file.key, "private");
  } catch (err) {
    await utapi.deleteFiles(file.key).catch(() => {});
    console.error("uploadthing: could not make evidence private", err);
    throw new UploadThingError("Upload failed");
  }

  const [existing] = await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.taskId, meta.taskId))
    .limit(1);

  const fields =
    column === "photo"
      ? { photoFileKey: file.key, photoFileName: file.name }
      : { pdfFileKey: file.key, pdfFileName: file.name };

  await db
    .insert(taskSubmissions)
    .values({
      taskId: meta.taskId,
      menteeId: meta.menteeId,
      // An upload can be the first thing that happens on a task, before the
      // mentee has explicitly chosen a route. The file itself names the route.
      kind: existing?.kind ?? (column === "pdf" ? "pdf" : "test_and_photo"),
      ...fields,
    })
    .onConflictDoUpdate({
      target: taskSubmissions.taskId,
      set: { ...fields, submittedAt: new Date() },
    });

  // Replacing a file removes the one it replaced, rather than orphaning a
  // private object nothing points at.
  const stale =
    column === "photo" ? existing?.photoFileKey : existing?.pdfFileKey;
  if (stale && stale !== file.key) {
    await utapi.deleteFiles(stale).catch(() => {});
  }

  // Uploading new evidence pulls the task back out of review, matching
  // reopenIfSubmitted() in dashboard/task-actions.ts — a mentor must never be
  // reviewing a submission that is still being changed underneath them.
  await db
    .update(tasks)
    .set({ status: "assigned", submittedAt: null })
    .where(and(eq(tasks.id, meta.taskId), eq(tasks.status, "submitted")));

  return { uploaded: true as const, fileName: file.name };
}

const taskInput = z.object({ taskId: z.uuid() });

export const ourFileRouter = {
  avatar: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");
      return { clerkId: userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(users)
        .set({ avatarUrl: file.ufsUrl })
        .where(eq(users.clerkId, metadata.clerkId));
      // Returned value is sent to the client's onClientUploadComplete.
      return { url: file.ufsUrl };
    }),

  governmentId: f({
    image: { maxFileSize: GOVERNMENT_ID_MAX, maxFileCount: 1 },
    pdf: { maxFileSize: GOVERNMENT_ID_MAX, maxFileCount: 1 },
  })
    .middleware(async () => requireMentorUpload())
    .onUploadComplete(async ({ metadata, file }) =>
      storeDocument(metadata.userId, "government_id", file),
    ),

  // PDF only, by deliberate omission of `image`. This is the enforcement:
  // the picker's `accept` attribute and the pre-flight check in
  // components/document-upload.tsx are both conveniences a crafted request
  // walks straight past, so an image sent to this endpoint has to be refused
  // here or it is not refused at all.
  mentorCv: f({
    pdf: { maxFileSize: MENTOR_CV_MAX, maxFileCount: 1 },
  })
    .middleware(async () => requireMentorUpload())
    .onUploadComplete(async ({ metadata, file }) =>
      storeDocument(metadata.userId, "cv", file),
    ),

  // Pictorial evidence: the photo half of the test-and-photo route.
  taskEvidencePhoto: f({
    image: { maxFileSize: TASK_PHOTO_MAX, maxFileCount: 1 },
  })
    .input(taskInput)
    .middleware(async ({ input }) => requireOwnOpenTask(input.taskId))
    .onUploadComplete(async ({ metadata, file }) =>
      storeEvidence(metadata, "photo", file),
    ),

  // The PDF route: the whole assignment, submitted as a document. PDF only,
  // by the same deliberate omission of `image` as the mentor CV endpoint —
  // "submit the assignment through a PDF" is not satisfied by a photograph.
  taskEvidencePdf: f({
    pdf: { maxFileSize: TASK_PDF_MAX, maxFileCount: 1 },
  })
    .input(taskInput)
    .middleware(async ({ input }) => requireOwnOpenTask(input.taskId))
    .onUploadComplete(async ({ metadata, file }) =>
      storeEvidence(metadata, "pdf", file),
    ),

  // Photos for the public website, uploaded from /admin/cms.
  //
  // Deliberately NOT flipped to a private ACL like the vetting documents above:
  // these are published photographs on a public marketing site, and a signed
  // URL that expires would break every cached page that embeds one. The
  // protection here is on WRITE — only an admin can put a file in this bucket —
  // not on read.
  //
  // Nothing is written to the database on completion. The URL is returned to
  // the admin form, which saves it as part of the row being edited; a photo
  // uploaded for a story the admin then abandons should not leave an orphan
  // record behind.
  cmsImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => requireAdminUpload())
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
