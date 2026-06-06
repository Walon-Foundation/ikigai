import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { invoices, payments } from "@/db/schema";
import { getGatewayByName } from "./gateway";

// Mark a payment paid and issue an invoice, idempotently. Safe to call from a
// status-poll or a webhook without double-issuing invoices.
export async function finalizePaid(paymentId: string): Promise<void> {
  const [payment] = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  if (!payment || payment.status === "paid") return;

  await db
    .update(payments)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(payments.id, paymentId));

  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.paymentId, paymentId))
    .limit(1);
  if (!existing) {
    await db.insert(invoices).values({
      paymentId,
      number: `INV-${Date.now().toString(36).toUpperCase()}`,
    });
  }
}

// Confirm a pending payment against its gateway and finalize if paid. Returns
// the resolved status. Used by the "check payment" button.
export async function syncPaymentStatus(
  paymentId: string,
): Promise<"paid" | "failed" | "pending"> {
  const [payment] = await db
    .select({
      id: payments.id,
      status: payments.status,
      provider: payments.provider,
      providerRef: payments.providerRef,
    })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  if (!payment) return "failed";
  if (payment.status === "paid") return "paid";
  if (!payment.providerRef) return "pending";

  const { status } = await getGatewayByName(payment.provider).confirm(
    payment.providerRef,
  );
  if (status === "paid") {
    await finalizePaid(paymentId);
  } else if (status === "failed") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, paymentId));
  }
  return status;
}

// Webhook entry point: a payment-code event names the Monime payment-code id
// (our `providerRef`). We look up our payment and re-confirm against Monime's
// API — so we never trust the webhook payload itself, only our authenticated
// retrieve. Returns true if a matching payment was finalized.
export async function syncByProviderRef(providerRef: string): Promise<boolean> {
  if (!providerRef) return false;
  const [payment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.providerRef, providerRef))
    .limit(1);
  if (!payment) return false;
  const status = await syncPaymentStatus(payment.id);
  return status === "paid";
}
