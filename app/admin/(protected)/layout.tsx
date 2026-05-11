import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db
    .select({
      role: users.role,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-sm px-4">
          <p className="font-display text-2xl font-black text-foreground">
            Access Denied
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This account doesn&apos;t have admin permissions.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/admin/sign-out"
              className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Sign in with admin account
            </a>
            <a
              href="/dashboard"
              className="inline-block rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Go to app
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen bg-background">
      <AdminSidebar displayName={dbUser.displayName} email={dbUser.email} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
