import { CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDbUser } from "@/lib/db-user";

export default async function ParentPortalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  const data = (user.onboardingData as Record<string, unknown> | null) ?? {};
  const childLinked = !!(data.childLinked as boolean | null);
  const inviteCode = (data.inviteCode as string | null) ?? null;
  const childEmail = (data.childEmail as string | null) ?? null;

  return (
    <>
      <PageHeader title="My Child" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Child Account
            </p>
            {childLinked ? (
              <p className="text-sm text-foreground">
                ✓ Linked to <span className="font-semibold">{childEmail}</span>
              </p>
            ) : inviteCode ? (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Awaiting your child to join with invite code:
                </p>
                <div className="rounded-xl bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
                  {inviteCode}
                </div>
              </div>
            ) : (
              <Link
                href="/onboarding/parent/link"
                className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Link child&apos;s account
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/parent-portal/mentors"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <Star className="size-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Mentors</p>
              <p className="text-xs text-muted-foreground">
                Browse &amp; approve
              </p>
            </Link>
            <Link
              href="/parent-portal/payments"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <CreditCard className="size-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Payments</p>
              <p className="text-xs text-muted-foreground">Manage billing</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
