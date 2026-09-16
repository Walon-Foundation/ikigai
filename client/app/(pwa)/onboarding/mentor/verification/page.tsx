import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { mentorDocuments } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { VerificationForm } from "./verification-form";

// A server component so the form starts out knowing which documents are
// already stored. Without that, an applicant who uploaded a CV, closed the app
// and came back would be told to upload the CV they had already sent — and the
// required-CV gate would block a complete application.
export default async function MentorVerificationPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const documents = await db
    .select({ kind: mentorDocuments.kind, fileName: mentorDocuments.fileName })
    .from(mentorDocuments)
    .where(eq(mentorDocuments.userId, user.id));

  // fileName is nullable, so the row's existence — not its name — is what
  // says a document is on file.
  const storedName = (kind: string) => {
    const doc = documents.find((d) => d.kind === kind);
    if (!doc) return null;
    return doc.fileName ?? "Uploaded";
  };

  return (
    <VerificationForm
      initialGovernmentId={storedName("government_id")}
      initialCv={storedName("cv")}
    />
  );
}
