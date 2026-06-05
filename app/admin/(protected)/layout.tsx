import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/db-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative admin gate — not just proxy.ts. A non-admin (or signed-out)
  // visitor is redirected away before any admin page renders.
  const dbUser = await requireAdmin();

  return (
    <div className="dark flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        displayName={dbUser?.displayName ?? "Admin"}
        email={dbUser?.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
