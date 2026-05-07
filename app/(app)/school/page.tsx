import Link from "next/link";
import { Users, MapPin, CheckCircle, Clock } from "lucide-react";
import { MOCK_SCHOOLS, MOCK_SCHOOL_MEMBERS } from "@/lib/mock-data";

export default function SchoolPage() {
  const school = MOCK_SCHOOLS[0];
  const isVerified = !!school.verifiedAt;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">
          School Clubhouse
        </h1>
        <p className="text-sm text-muted-foreground">
          Your campus Ikigai community
        </p>
      </div>

      {/* School card */}
      <div className="mb-6 rounded-2xl bg-primary p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-primary-muted">Your School</p>
            <h2 className="font-display text-xl font-black">{school.name}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-primary-muted">
              <MapPin className="size-3.5" />
              <span className="capitalize">{school.region.replace("_", " ")}</span>
            </div>
          </div>
          {isVerified ? (
            <div className="flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold">
              <CheckCircle className="size-3" />
              Verified
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
              <Clock className="size-3" />
              Pending
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Users className="size-4 text-primary-muted" />
          <span className="text-sm text-primary-muted">
            {school.memberCount} members
          </span>
        </div>
      </div>

      {/* Pending notice */}
      {!isVerified && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent-pale p-4">
          <p className="text-sm font-semibold text-foreground">
            Awaiting admin verification
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Our team is reviewing your school registration. You&apos;ll be
            notified once approved.
          </p>
        </div>
      )}

      {/* Members */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Members ({school.memberCount})
          </p>
        </div>
        <div className="space-y-2">
          {MOCK_SCHOOL_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary-muted/30 font-display text-xs font-bold text-primary">
                {member.displayName.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {member.displayName}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {member.role.replace("_", " ")}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Level {member.growthLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-semibold text-foreground">Announcements</p>
        <div className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
          No announcements yet.
        </div>
      </div>
    </div>
  );
}
