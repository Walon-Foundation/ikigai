import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
