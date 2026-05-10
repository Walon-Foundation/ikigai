import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db/db";
import { safetyReports, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { ResolveActions } from "./resolve-actions";

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const reporterUser = aliasedTable(users, "reporter");
  const reportedUser = aliasedTable(users, "reported");

  const [report] = await db
    .select({
      id: safetyReports.id,
      type: safetyReports.type,
      notes: safetyReports.notes,
      resolvedAt: safetyReports.resolvedAt,
      createdAt: safetyReports.createdAt,
      reporterName: reporterUser.displayName,
      reportedName: reportedUser.displayName,
    })
    .from(safetyReports)
    .leftJoin(reporterUser, eq(safetyReports.reporterId, reporterUser.id))
    .leftJoin(reportedUser, eq(safetyReports.reportedId, reportedUser.id))
    .where(eq(safetyReports.id, id))
    .limit(1);

  if (!report) notFound();

  const isResolved = !!report.resolvedAt;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/reports"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Reports
      </Link>

      <div className="mb-2 flex items-center gap-2">
        <h1 className="font-display text-3xl font-black text-foreground">
          Report Detail
        </h1>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold capitalize",
            isResolved
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {isResolved ? "Resolved" : "Open"}
        </span>
      </div>

      {/* Report Info */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Reported By
            </p>
            <p className="font-medium text-foreground">
              {report.reporterName ?? "Anonymous"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Reported User
            </p>
            <p className="font-medium text-foreground">
              {report.reportedName ?? "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Type
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                report.type === "inappropriate"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent/10 text-accent"
              )}
            >
              {report.type}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Date
            </p>
            <p className="font-medium text-foreground">
              {report.createdAt
                ? new Date(report.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notes
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {report.notes ?? "No notes provided."}
          </p>
        </div>
      </div>

      <ResolveActions
        reportId={id}
        initialResolved={isResolved}
        resolvedAt={report.resolvedAt?.toISOString() ?? null}
      />
    </div>
  );
}
