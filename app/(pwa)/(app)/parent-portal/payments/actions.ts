"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { paymentPlans, payments } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { getGateway } from "@/lib/payments/gateway";
import { finalizePaid, syncPaymentStatus } from "@/lib/payments/service";

type OnboardingData = { parentProfile?: { phone?: string } } | null;

export type PayResult = {
  status: "paid" | "pending";
  paymentId: string;
  ussdCode?: string;
};

// Pay for a plan. Creates a pending payment and starts it via the active
// gateway. The stub settles immediately; Monime returns a USSD code the payer
// dials on their phone, confirmed later by webhook or the "check" button.
export async function payForPlan(
  planId: string,
  phoneNumber?: string,
): Promise<PayResult> {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof planId !== "string" || !planId) throw new Error("Invalid plan");

  const [plan] = await db
    .select()
    .from(paymentPlans)
    .where(eq(paymentPlans.id, planId))
    .limit(1);
  if (!plan || !plan.active) throw new Error("Plan not available");

  const gateway = getGateway();

  // Resolve the payer's phone (needed for Monime payment codes).
  const stored = (me.onboardingData as OnboardingData)?.parentProfile?.phone;
  const phone = (phoneNumber || stored || "").trim();
  if (gateway.name === "monime" && !phone) {
    throw new Error("A phone number is required to pay by mobile money");
  }

  const [payment] = await db
    .insert(payments)
    .values({
      payerId: me.id,
      planId: plan.id,
      amount: plan.amount,
      status: "pending",
      provider: gateway.name,
    })
    .returning({ id: payments.id });

  const result = await gateway.startPayment({
    amount: plan.amount,
    reference: payment.id,
    name: plan.name,
    customerName: me.displayName ?? "Ikigai user",
    phoneNumber: phone,
  });

  await db
    .update(payments)
    .set({ providerRef: result.providerRef })
    .where(eq(payments.id, payment.id));

  if (result.status === "paid") {
    await finalizePaid(payment.id);
    revalidatePath("/parent-portal/payments");
    return { status: "paid", paymentId: payment.id };
  }

  return {
    status: "pending",
    paymentId: payment.id,
    ussdCode: result.ussdCode,
  };
}

// Poll a pending payment's status (after the payer dials the USSD code).
export async function confirmPayment(paymentId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof paymentId !== "string" || !paymentId) {
    throw new Error("Invalid payment");
  }
  const status = await syncPaymentStatus(paymentId);
  revalidatePath("/parent-portal/payments");
  return { status };
}
