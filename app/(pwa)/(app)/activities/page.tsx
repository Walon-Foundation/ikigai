import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ActivitiesPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <PageHeader title="Activities" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-3xl">📅</p>
          <p className="mt-3 font-semibold text-foreground">Activity Hub</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Workshops, networking events, wellness sessions, and leadership
            camps will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
