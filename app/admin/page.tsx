import { redirect } from "next/navigation";

export default async function AdminRootPage() {
  // Auth + admin-role gating happens in proxy.ts; reaching here means an admin.
  // Clean URL: the proxy rewrites "/dashboard" → "/admin/dashboard".
  redirect("/dashboard");
}
