import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";

const f = createUploadthing();

// The image bytes never pass through this backend — the browser uploads them
// directly to UploadThing's storage. This server-side middleware only runs to
// authenticate the Clerk user and authorize the upload; onUploadComplete then
// receives the stored file's URL (not the bytes) and persists it.
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
