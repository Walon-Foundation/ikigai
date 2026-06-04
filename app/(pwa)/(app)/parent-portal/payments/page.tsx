import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentPaymentsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  return (
    <>
      <PageHeader title="Payments" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Payment management is coming soon. Mentorship subscriptions and
          one-time packages will appear here.
        </div>
      </div>
    </>
  );
}
