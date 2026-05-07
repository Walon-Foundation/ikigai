import Link from "next/link";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { MOCK_REPORTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  inappropriate: "bg-destructive/10 text-destructive",
  concern: "bg-accent/10 text-accent",
};

export default function AdminReportsPage() {
  const open = MOCK_REPORTS.filter((r) => !r.resolvedAt);
  const resolved = MOCK_REPORTS.filter((r) => r.resolvedAt);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Safety Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and resolve user-submitted safety reports
        </p>
      </div>

      {/* Open */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">
            Open Reports
          </h2>
          {open.length > 0 && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
              {open.length}
            </span>
          )}
        </div>
        {open.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No open reports — all clear ✓
          </div>
        ) : (
          <div className="space-y-3">
            {open.map((report) => (
              <Link
                key={report.id}
                href={`/admin/reports/${report.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-destructive/40 transition-colors"
              >
                <AlertTriangle className="size-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        TYPE_STYLES[report.type] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {report.type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-1">
                    {report.notes}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reported by {report.reporter.displayName} ·{" "}
                    {new Date(report.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Resolved
        </h2>
        <div className="space-y-3">
          {resolved.map((report) => (
            <Link
              key={report.id}
              href={`/admin/reports/${report.id}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 opacity-70 hover:opacity-100 transition-opacity"
            >
              <CheckCircle className="size-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground line-clamp-1">
                  {report.notes}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Reported by {report.reporter.displayName} · Resolved{" "}
                  {new Date(report.resolvedAt!).toLocaleDateString("en-GB")}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Resolved
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
