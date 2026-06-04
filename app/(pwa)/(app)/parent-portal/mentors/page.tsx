import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentMentorsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  return (
    <>
      <PageHeader title="Mentors" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Mentor browsing and approval for parents is coming soon.
        </div>
      </div>
    </>
  );
}
