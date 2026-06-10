import "server-only";
import { env } from "@/lib/env";
import { getMonimeClient, monimeEnabled } from "./monime";

// Payment gateway abstraction (PRD §20). The app talks to this interface only,
// so the stub and Monime are interchangeable. Monime uses USSD payment codes:
// we create a code, show the payer the USSD string to dial on their phone, and
// confirm completion via webhook / status retrieval.

export type StartPaymentRequest = {
  amount: number; // SLE minor units
  reference: string; // our payment id
  name: string; // payment description shown to the payer
  customerName: string;
  phoneNumber: string; // authorized payer phone
};

export type StartPaymentResult = {
  // 'paid' = settled synchronously (stub). 'pending' = show `ussdCode` and
  // confirm later (webhook or retrieve).
  status: "paid" | "pending";
  providerRef: string;
  ussdCode?: string;
};

export type ConfirmResult = { status: "paid" | "failed" | "pending" };

export interface PaymentGateway {
  readonly name: string;
  startPayment(req: StartPaymentRequest): Promise<StartPaymentResult>;
  confirm(providerRef: string): Promise<ConfirmResult>;
}

function mapStatus(raw: string | undefined): ConfirmResult["status"] {
  const s = (raw ?? "").toLowerCase();
  if (["completed", "paid", "successful", "success"].includes(s)) return "paid";
  if (["expired", "failed", "cancelled", "canceled"].includes(s)) {
    return "failed";
  }
  return "pending"; // 'pending' | 'processing'
}

// Development gateway: settles immediately, no network.
class StubGateway implements PaymentGateway {
  readonly name = "stub";
  async startPayment(req: StartPaymentRequest): Promise<StartPaymentResult> {
    return { status: "paid", providerRef: `stub_${req.reference}` };
  }
  async confirm(): Promise<ConfirmResult> {
    return { status: "paid" };
  }
}

// Real Monime gateway via USSD payment codes (monime-package).
class MonimeGateway implements PaymentGateway {
  readonly name = "monime";

  async startPayment(req: StartPaymentRequest): Promise<StartPaymentResult> {
    const client = getMonimeClient();
    const res = await client.paymentCode.create({
      paymentName: req.name,
      amount: req.amount, // SLE minor units
      name: req.customerName,
      authorizedPhoneNumber: req.phoneNumber,
      financialAccountId: env.monimeFinancialAccountId,
      metadata: { reference: req.reference },
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? "Could not create payment code");
    }
    return {
      status: "pending",
      providerRef: res.data.id,
      ussdCode: res.data.ussdCode,
    };
  }

  async confirm(providerRef: string): Promise<ConfirmResult> {
    const client = getMonimeClient();
    const res = await client.paymentCode.retrieve(providerRef);
    if (!res.success || !res.data) return { status: "pending" };
    return { status: mapStatus(res.data.status) };
  }
}

const stub = new StubGateway();
const monime = new MonimeGateway();

// Active gateway, chosen by env. Falls back to the stub unless Monime is fully
// configured, so dev and unconfigured deploys keep working.
export function getGateway(): PaymentGateway {
  return monimeEnabled() ? monime : stub;
}

// Resolve a gateway by the name stored on a payment, so a payment created with
// one provider is always confirmed against the same one.
export function getGatewayByName(name: string): PaymentGateway {
  return name === "monime" ? monime : stub;
}
