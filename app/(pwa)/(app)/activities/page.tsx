import { Calendar } from "lucide-react";
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
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-muted/20 text-primary">
            <Calendar className="size-6" />
          </div>
          <p className="mt-4 font-semibold text-foreground">Activity Hub</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Workshops, networking events, wellness sessions, and leadership
            camps will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
