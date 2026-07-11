import { clientEnv } from "@/lib/env.client";

// VAPID public keys are base64url; the browser wants a Uint8Array.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export type PushSubscribeResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "no-key" | "error" };

/**
 * Prompt for permission and subscribe this browser to Web Push. Returns a
 * structured result so the UI can explain failures instead of silently toggling.
 * Registers the service worker if it isn't already controlling the page.
 */
export async function subscribeToPush(
  save: (subscription: unknown) => Promise<void>,
): Promise<PushSubscribeResult> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return { ok: false, reason: "unsupported" };
  }
  if (!clientEnv.vapidPublicKey) {
    return { ok: false, reason: "no-key" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const registration =
      (await navigator.serviceWorker.getRegistration()) ??
      (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          clientEnv.vapidPublicKey,
        ) as BufferSource,
      }));

    await save(subscription.toJSON());
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // ignore
  }
}
