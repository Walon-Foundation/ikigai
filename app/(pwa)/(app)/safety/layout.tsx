import { requireRole } from "@/lib/db-user";

// Safety is a mentee module rendered client-side, so the role boundary lives
// in this server layout rather than in the page.
export default async function SafetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["mentee"]);
  return <>{children}</>;
}
