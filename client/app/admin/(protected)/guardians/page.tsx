import { aliasedTable, desc, eq } from "drizzle-orm";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { guardianLinks, users } from "@/db/schema";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-primary/10 text-primary",
  pending: "bg-accent/10 text-accent",
  declined: "bg-muted text-muted-foreground",
};

function fmt(date: Date | null): string {
  return date ? new Date(date).toLocaleDateString("en-GB") : "—";
}

export default async function AdminGuardiansPage() {
  const parentUser = aliasedTable(users, "parent");
  const childUser = aliasedTable(users, "child");

  const rows = await db
    .select({
      id: guardianLinks.id,
      relationship: guardianLinks.relationship,
      status: guardianLinks.status,
      childEmail: guardianLinks.childEmail,
      respondedAt: guardianLinks.respondedAt,
      createdAt: guardianLinks.createdAt,
      parentId: parentUser.id,
      parentName: parentUser.displayName,
      childId: childUser.id,
      childName: childUser.displayName,
    })
    .from(guardianLinks)
    .leftJoin(parentUser, eq(guardianLinks.parentId, parentUser.id))
    .leftJoin(childUser, eq(guardianLinks.childId, childUser.id))
    .orderBy(desc(guardianLinks.createdAt));

  const accepted = rows.filter((r) => r.status === "accepted").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Guardian Links
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parent / guardian ↔ child relationships and consent status
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Summary label="Total links" value={rows.length} />
        <Summary label="Accepted" value={accepted} />
        <Summary label="Pending consent" value={pending} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Parent / Guardian</th>
                <th className="px-4 py-3">Child</th>
                <th className="hidden px-4 py-3 md:table-cell">Relationship</th>
                <th className="hidden px-4 py-3 lg:table-cell">Linked</th>
                <th className="px-4 py-3">Consent</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No guardian links yet.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      i % 2 === 0 ? "" : "bg-muted/20",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="size-4 shrink-0 text-muted-foreground" />
                        {r.parentId ? (
                          <Link
                            href={`/admin/users/${r.parentId}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {r.parentName ?? "Unknown"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.childId ? (
                        <Link
                          href={`/admin/users/${r.childId}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {r.childName ?? "Unknown"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {r.childEmail ?? "Pending invite"}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground capitalize md:table-cell">
                      {r.relationship ?? "parent"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {fmt(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          STATUS_STYLES[r.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-display text-3xl font-black text-primary">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{label}</p>
    </div>
  );
}
