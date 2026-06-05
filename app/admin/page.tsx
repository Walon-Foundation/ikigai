import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/db-user";

export default async function AdminRootPage() {
  // Authoritative admin gate — this page sits outside the (protected) group, so
  // guard it directly rather than trusting proxy.ts alone.
  await requireAdmin();
  // Clean URL: the proxy rewrites "/dashboard" → "/admin/dashboard".
  redirect("/dashboard");
}
