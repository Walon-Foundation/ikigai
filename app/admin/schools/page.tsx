import Link from "next/link";
import { Clock, ChevronRight, CheckCircle } from "lucide-react";
import { MOCK_PENDING_SCHOOLS, MOCK_SCHOOLS } from "@/lib/mock-data";

export default function AdminSchoolsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          School Vetting
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve school club registrations
        </p>
      </div>

      {/* Pending */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">
            Pending Review
          </h2>
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            {MOCK_PENDING_SCHOOLS.length}
          </span>
        </div>
        <div className="space-y-3">
          {MOCK_PENDING_SCHOOLS.map((school) => (
            <Link
              key={school.id}
              href={`/admin/schools/${school.id}/vet`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-2xl">
                🏫
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{school.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {school.region.replace("_", " ")} · Submitted by{" "}
                  {school.submittedBy}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>
                    {new Date(school.submittedAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Pending
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Verified */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Active School Clubs
        </h2>
        <div className="space-y-3">
          {MOCK_SCHOOLS.filter((s) => s.verifiedAt).map((school) => (
            <div
              key={school.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="text-2xl">🏫</div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{school.name}</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {school.region.replace("_", " ")} · {school.memberCount}{" "}
                  members
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <CheckCircle className="size-3" />
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
