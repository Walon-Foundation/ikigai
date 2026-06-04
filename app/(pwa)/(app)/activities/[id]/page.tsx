import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/db-user";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/activities"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Activities
      </Link>
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Activity detail page coming soon.
      </div>
    </div>
  );
}
