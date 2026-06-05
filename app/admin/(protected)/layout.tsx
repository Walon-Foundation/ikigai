import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin-sidebar";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth + admin-role gating happens in proxy.ts — reaching here means the
  // visitor is a signed-in admin. We only fetch the user for the sidebar.
  const { userId } = await auth();

  const [dbUser] = userId
    ? await db
        .select({
          displayName: users.displayName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1)
    : [];

  return (
    <div className="dark flex min-h-screen bg-background">
      <AdminSidebar
        displayName={dbUser?.displayName ?? "Admin"}
        email={dbUser?.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
