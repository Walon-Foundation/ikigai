import { eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { schools, users } from "@/db/schema";
import { VetActions } from "./vet-actions";

export default async function VetSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1);

  if (!school) notFound();

  let clubLeadName: string | null = null;
  if (school.clubLeadId) {
    const [lead] = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, school.clubLeadId))
      .limit(1);
    clubLeadName = lead?.displayName ?? null;
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/schools"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Schools
      </Link>

      <h1 className="font-display mb-6 text-3xl font-black text-foreground">
        Vet School Registration
      </h1>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="text-4xl">🏫</div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {school.name}
            </h2>
            <p className="text-sm capitalize text-muted-foreground">
              {school.region?.replace("_", " ") ?? "—"}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {clubLeadName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted by</span>
              <span className="font-medium text-foreground">
                {clubLeadName}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Region</span>
            <span className="font-medium capitalize text-foreground">
              {school.region?.replace("_", " ") ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Approving this school will create an active Clubhouse for all students
          at {school.name}. The club lead will receive a notification and can
          start inviting members immediately.
        </p>
      </div>

      <VetActions schoolId={id} schoolName={school.name} />
    </div>
  );
}
