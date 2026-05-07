"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MOCK_ALL_USERS } from "@/lib/mock-data";

type RoleFilter = "all" | "mentee" | "mentor" | "club_lead";

const ROLE_LABELS: Record<string, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  club_lead: "Club Lead",
  admin: "Admin",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  verified: "bg-primary/10 text-primary",
  pending: "bg-accent/10 text-accent",
  suspended: "bg-destructive/10 text-destructive",
};

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<RoleFilter>("all");

  const filtered =
    filter === "all"
      ? MOCK_ALL_USERS
      : MOCK_ALL_USERS.filter((u) => u.role === filter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All registered platform users
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "mentee", "mentor", "club_lead"] as RoleFilter[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "All Users" : f.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  School
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Level
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user.id}
                  className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 0 ? "" : "bg-muted/20"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                        {user.displayName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-foreground">
                        {user.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {user.school}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.growthLevel}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_STYLES[user.status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
