import { supabase } from "@/integrations/supabase/client";

// Public by design, the VAPID public key is meant to be embedded client side.
const VAPID_PUBLIC_KEY = "BP-yIlwu6ACcesFWerrh6dCIVVB4_pHHS4fwOCLb9jkqqh102urphXoSo5FOgvuItei8DweCQi_Jst21RmS4FwE";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function enablePushNotifications(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: "This browser doesn't support push notifications." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission wasn't granted." };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const { error } = await (supabase as any).from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function disablePushNotifications(userId: string) {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await (supabase as any).from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", subscription.endpoint);
    await subscription.unsubscribe();
  }
}
