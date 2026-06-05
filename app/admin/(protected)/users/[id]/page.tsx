import { aliasedTable, count, desc, eq, sql } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import {
  growthTrees,
  guardianLinks,
  journalEntries,
  mentorships,
  milestones,
  schools,
  tasks,
  users,
} from "@/db/schema";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  club_lead: "Club Lead",
  parent: "Parent / Guardian",
  admin: "Admin",
};

function fmt(date: Date | null): string {
  return date ? new Date(date).toLocaleDateString("en-GB") : "—";
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      bio: users.bio,
      interestTags: users.interestTags,
      growthLevel: users.growthLevel,
      verifiedAt: users.verifiedAt,
      createdAt: users.createdAt,
      schoolName: schools.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!user) notFound();

  const initials = (user.displayName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to users
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-black text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-foreground">
            {user.displayName ?? "Unknown user"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            {user.email && <span>{user.email}</span>}
            <span>· Joined {fmt(user.createdAt)}</span>
          </div>
          {user.bio && (
            <p className="mt-3 max-w-2xl text-sm text-foreground">{user.bio}</p>
          )}
          {user.interestTags && user.interestTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent capitalize"
                >
                  {tag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {user.role === "mentee" && <MenteePanel userId={user.id} />}
      {user.role === "mentor" && <MentorPanel userId={user.id} />}
      {user.role === "parent" && <ParentPanel userId={user.id} />}
    </div>
  );
}

/* ---------------------------- Mentee monitoring ---------------------------- */

async function MenteePanel({ userId }: { userId: string }) {
  const mentorUser = aliasedTable(users, "mentor");

  const [tree] = await db
    .select()
    .from(growthTrees)
    .where(eq(growthTrees.userId, userId))
    .limit(1);

  const [menteeMilestones, menteeTasks, mentorshipRows, recentJournals] =
    await Promise.all([
      db
        .select({ type: milestones.type, completedAt: milestones.completedAt })
        .from(milestones)
        .where(eq(milestones.userId, userId)),
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          dueDate: tasks.dueDate,
          completedAt: tasks.completedAt,
        })
        .from(tasks)
        .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
        .where(eq(mentorships.menteeId, userId))
        .orderBy(desc(tasks.createdAt))
        .limit(20),
      db
        .select({
          id: mentorships.id,
          status: mentorships.status,
          matchScore: mentorships.matchScore,
          mentorName: mentorUser.displayName,
          mentorId: mentorUser.id,
        })
        .from(mentorships)
        .leftJoin(mentorUser, eq(mentorships.mentorId, mentorUser.id))
        .where(eq(mentorships.menteeId, userId))
        .orderBy(desc(mentorships.createdAt)),
      db
        .select({
          id: journalEntries.id,
          visibility: journalEntries.visibility,
          keywordFlag: journalEntries.keywordFlag,
          createdAt: journalEntries.createdAt,
        })
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(5),
    ]);

  const completed = menteeTasks.filter((t) => t.status === "completed").length;
  const failed = menteeTasks.filter((t) => t.status === "failed").length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Growth Tree">
        {tree ? (
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Stage" value={String(tree.stage)} />
            <Stat label="Points" value={String(tree.growthPoints)} />
            <Stat label="Health" value={`${tree.health}%`} />
          </div>
        ) : (
          <Empty>No growth tree yet.</Empty>
        )}
      </Card>

      <Card title="Mentorship">
        {mentorshipRows.length === 0 ? (
          <Empty>Not matched with a mentor.</Empty>
        ) : (
          <div className="space-y-2">
            {mentorshipRows.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-sm"
              >
                <Link
                  href={m.mentorId ? `/admin/users/${m.mentorId}` : "#"}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {m.mentorName ?? "Unknown mentor"}
                </Link>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {m.matchScore != null && <span>{m.matchScore}% match</span>}
                  <StatusPill status={m.status ?? "requested"} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Tasks (${completed} done · ${failed} failed)`}>
        {menteeTasks.length === 0 ? (
          <Empty>No tasks assigned.</Empty>
        ) : (
          <ul className="space-y-2">
            {menteeTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground line-clamp-1">{t.title}</span>
                <StatusPill status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Milestones">
        {menteeMilestones.length === 0 ? (
          <Empty>No milestones completed.</Empty>
        ) : (
          <ul className="space-y-2">
            {menteeMilestones.map((m) => (
              <li
                key={m.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground capitalize">
                  {(m.type ?? "").replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmt(m.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recent Journals" className="lg:col-span-2">
        {recentJournals.length === 0 ? (
          <Empty>No journal entries.</Empty>
        ) : (
          <ul className="space-y-2">
            {recentJournals.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground capitalize">
                    {(j.visibility ?? "private").replace(/_/g, " ")}
                  </span>
                  {j.keywordFlag && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      Flagged
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmt(j.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/safeguarding"
          className="mt-3 inline-block text-xs font-medium text-primary"
        >
          View safeguarding alerts →
        </Link>
      </Card>
    </div>
  );
}

/* ---------------------------- Mentor monitoring ---------------------------- */

async function MentorPanel({ userId }: { userId: string }) {
  const menteeUser = aliasedTable(users, "mentee");

  const [menteeRows, [taskTotals], assignedTasks] = await Promise.all([
    db
      .select({
        id: mentorships.id,
        status: mentorships.status,
        matchScore: mentorships.matchScore,
        lastActivityAt: mentorships.lastActivityAt,
        menteeName: menteeUser.displayName,
        menteeId: menteeUser.id,
      })
      .from(mentorships)
      .leftJoin(menteeUser, eq(mentorships.menteeId, menteeUser.id))
      .where(eq(mentorships.mentorId, userId))
      .orderBy(desc(mentorships.createdAt)),
    db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        failed: sql<number>`count(*) filter (where ${tasks.status} = 'failed')`,
      })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .where(eq(mentorships.mentorId, userId)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        menteeName: menteeUser.displayName,
      })
      .from(tasks)
      .innerJoin(mentorships, eq(tasks.mentorshipId, mentorships.id))
      .leftJoin(menteeUser, eq(mentorships.menteeId, menteeUser.id))
      .where(eq(mentorships.mentorId, userId))
      .orderBy(desc(tasks.createdAt))
      .limit(20),
  ]);

  const total = Number(taskTotals?.total ?? 0);
  const completed = Number(taskTotals?.completed ?? 0);
  const failed = Number(taskTotals?.failed ?? 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeMentees = menteeRows.filter((m) => m.status === "active").length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Activity Summary">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Mentees" value={String(menteeRows.length)} />
          <Stat label="Active" value={String(activeMentees)} />
          <Stat label="Tasks set" value={String(total)} />
          <Stat label="Completion" value={`${completionRate}%`} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {completed} completed · {failed} failed
        </p>
      </Card>

      <Card title={`Mentees (${menteeRows.length})`}>
        {menteeRows.length === 0 ? (
          <Empty>No mentees assigned.</Empty>
        ) : (
          <div className="space-y-2">
            {menteeRows.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-sm"
              >
                <Link
                  href={m.menteeId ? `/admin/users/${m.menteeId}` : "#"}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {m.menteeName ?? "Unknown mentee"}
                </Link>
                <StatusPill status={m.status ?? "requested"} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Tasks Assigned" className="lg:col-span-2">
        {assignedTasks.length === 0 ? (
          <Empty>No tasks assigned yet.</Empty>
        ) : (
          <ul className="space-y-2">
            {assignedTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground line-clamp-1">
                  {t.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    → {t.menteeName ?? "—"}
                  </span>
                </span>
                <StatusPill status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------- Parent monitoring ---------------------------- */

async function ParentPanel({ userId }: { userId: string }) {
  const childUser = aliasedTable(users, "child");

  const links = await db
    .select({
      id: guardianLinks.id,
      relationship: guardianLinks.relationship,
      status: guardianLinks.status,
      childEmail: guardianLinks.childEmail,
      respondedAt: guardianLinks.respondedAt,
      createdAt: guardianLinks.createdAt,
      childName: childUser.displayName,
      childId: childUser.id,
    })
    .from(guardianLinks)
    .leftJoin(childUser, eq(guardianLinks.childId, childUser.id))
    .where(eq(guardianLinks.parentId, userId))
    .orderBy(desc(guardianLinks.createdAt));

  return (
    <Card title={`Linked Children (${links.length})`}>
      {links.length === 0 ? (
        <Empty>No children linked.</Empty>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div>
                {l.childId ? (
                  <Link
                    href={`/admin/users/${l.childId}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {l.childName ?? "Unknown child"}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">
                    {l.childEmail ?? "Pending invite"}
                  </span>
                )}
                <p className="text-xs text-muted-foreground capitalize">
                  {l.relationship ?? "parent"} · linked {fmt(l.createdAt)}
                </p>
              </div>
              <StatusPill status={l.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* -------------------------------- Primitives ------------------------------- */

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card p-6", className)}
    >
      <h2 className="mb-4 font-display text-lg font-bold text-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-black text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  accepted: "bg-primary/10 text-primary",
  completed: "bg-primary/10 text-primary",
  requested: "bg-accent/10 text-accent",
  pending: "bg-accent/10 text-accent",
  assigned: "bg-accent/10 text-accent",
  declined: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
