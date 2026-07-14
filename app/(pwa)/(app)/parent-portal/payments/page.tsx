import { desc, eq } from "drizzle-orm";
import { CreditCard, FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { invoices, paymentPlans, payments } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { PayWidget } from "./payments-client";

type OnboardingData = { parentProfile?: { phone?: string } } | null;

const DEFAULT_PLANS = [
  {
    name: "Monthly Mentorship",
    kind: "subscription" as const,
    amount: 5000,
    interval: "monthly" as const,
  },
  {
    name: "10-Session Package",
    kind: "package" as const,
    amount: 40000,
    interval: null,
  },
  {
    name: "Scholarship Sponsorship",
    kind: "scholarship" as const,
    amount: 25000,
    interval: null,
  },
];

function money(amount: number): string {
  return `Le ${(amount / 100).toLocaleString()}`;
}

export default async function ParentPaymentsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  const defaultPhone =
    (user.onboardingData as OnboardingData)?.parentProfile?.phone ?? "";

  const [initialPlans, history] = await Promise.all([
    db.select().from(paymentPlans).where(eq(paymentPlans.active, true)),
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        createdAt: payments.createdAt,
        invoiceNumber: invoices.number,
      })
      .from(payments)
      .leftJoin(invoices, eq(invoices.paymentId, payments.id))
      .where(eq(payments.payerId, user.id))
      .orderBy(desc(payments.createdAt)),
  ]);

  // Seed the default plans the first time anyone opens this page. The old code
  // paid a COUNT(*) round-trip on every single load to discover a thing that is
  // only ever true once; the plans query we just ran already tells us. Deferring
  // the seed instead would have rendered an empty plan list to whoever happened
  // to load the page first, so this stays on the request path — it runs at most
  // once in the lifetime of the deployment.
  let plans = initialPlans;
  if (plans.length === 0) {
    plans = await db.insert(paymentPlans).values(DEFAULT_PLANS).returning();
  }

  return (
    <>
      <PageHeader title="Payments" />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plans
          </p>
          <div className="space-y-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" />
                      <p className="font-semibold text-foreground">{p.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {money(p.amount)}
                      {p.interval ? ` / ${p.interval}` : " one-time"} ·{" "}
                      <span className="capitalize">{p.kind}</span>
                    </p>
                  </div>
                  <PayWidget planId={p.id} defaultPhone={defaultPhone} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            History
          </p>
          {history.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No payments yet.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {money(h.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.createdAt
                        ? new Date(h.createdAt).toLocaleDateString("en-GB")
                        : ""}
                      {h.invoiceNumber && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <FileText className="size-3" />
                          {h.invoiceNumber}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      h.status === "paid"
                        ? "bg-primary/10 text-primary"
                        : h.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Mobile money payments are processed by Monime. In development a stub
          gateway settles instantly.
        </p>
      </div>
    </>
  );
}
