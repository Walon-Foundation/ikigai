import { type NextRequest, NextResponse } from "next/server";
import { syncByProviderRef } from "@/lib/payments/service";

// Monime webhook receiver for payment-code events. We do NOT trust the payload:
// we read the payment-code id from the envelope and re-confirm it against
// Monime's authenticated API (syncByProviderRef → paymentCode.retrieve) before
// finalizing. So a forged webhook can't mark anything paid.
//
// Envelope shape: { apiVersion, event: { id, name, timestamp }, object: { id,
// type }, data }.
export async function POST(request: NextRequest) {
  let body: {
    event?: { name?: string };
    object?: { id?: string };
    data?: { id?: string };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.event?.name ?? "";
  // Only payment-code events carry a code id we can confirm.
  if (!eventName.startsWith("payment_code")) {
    return NextResponse.json({ ignored: true });
  }

  const providerRef = body.object?.id ?? body.data?.id;
  if (!providerRef) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await syncByProviderRef(providerRef);
  } catch (error) {
    console.error("monime webhook: confirm failed", error);
    // 200 anyway so Monime doesn't hammer retries; the "check" button and a
    // later event still reconcile.
  }

  return NextResponse.json({ received: true });
}
