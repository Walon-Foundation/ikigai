import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { db } from "@/db/db";
import { mentorDocuments, users } from "@/db/schema";

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
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => requireMentorUpload())
    .onUploadComplete(async ({ metadata, file }) =>
      storeDocument(metadata.userId, "government_id", file),
    ),

  mentorCv: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => requireMentorUpload())
    .onUploadComplete(async ({ metadata, file }) =>
      storeDocument(metadata.userId, "cv", file),
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
