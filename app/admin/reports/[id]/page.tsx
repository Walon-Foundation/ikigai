"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { MOCK_REPORTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const report = MOCK_REPORTS.find((r) => r.id === id) ?? MOCK_REPORTS[0];
  const [resolved, setResolved] = useState(!!report.resolvedAt);

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
            resolved
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {resolved ? "Resolved" : "Open"}
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
              {report.reporter.displayName}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Reported User
            </p>
            <p className="font-medium text-foreground">
              {report.reported.displayName}
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
              {new Date(report.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notes
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {report.notes}
          </p>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Notes
        </p>
        <textarea
          rows={3}
          placeholder="Add notes about the action taken..."
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* Action */}
      {!resolved ? (
        <button
          onClick={() => setResolved(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary-light transition-colors"
        >
          <Check className="size-5" />
          Mark as Resolved
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-full border border-primary py-4 text-sm font-semibold text-primary">
          <Check className="size-5" />
          Resolved on{" "}
          {report.resolvedAt
            ? new Date(report.resolvedAt).toLocaleDateString("en-GB")
            : "today"}
        </div>
      )}
    </div>
  );
}
