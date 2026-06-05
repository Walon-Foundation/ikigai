import { CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentPaymentsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  return (
    <>
      <PageHeader title="Payments" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-muted/20 text-primary">
            <CreditCard className="size-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">
            Payments are coming soon
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay for your child&apos;s mentorship with Orange Money or Africell
            Money. Subscriptions and one-time packages will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
