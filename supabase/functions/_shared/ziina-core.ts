export type ZiinaPaymentIntentStatus =
  | "requires_payment_instrument"
  | "requires_user_action"
  | "pending"
  | "completed"
  | "failed"
  | "canceled";

export interface ZiinaPaymentIntentPayload {
  amount: number;
  currency_code: string;
  message: string;
  success_url: string;
  cancel_url: string;
  failure_url: string;
  operation_id: string;
  test: boolean;
  allow_tips: boolean;
}

export interface ZiinaRefundPayload {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency_code: string;
  test: boolean;
}

export const buildPaymentIntentPayload = (body: {
  amount: number;
  currency_code: string;
  message: string;
  success_url: string;
  cancel_url: string;
  failure_url: string;
  operation_id: string;
  test: boolean;
  allow_tips?: boolean;
}): ZiinaPaymentIntentPayload => ({
  amount: body.amount,
  currency_code: body.currency_code.toUpperCase(),
  message: body.message,
  success_url: body.success_url,
  cancel_url: body.cancel_url,
  failure_url: body.failure_url,
  operation_id: body.operation_id,
  test: body.test,
  allow_tips: body.allow_tips ?? false,
});

export const buildRefundPayload = (body: {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency_code: string;
  test: boolean;
}): ZiinaRefundPayload => ({
  id: body.id,
  payment_intent_id: body.payment_intent_id,
  amount: body.amount,
  currency_code: body.currency_code.toUpperCase(),
  test: body.test,
});

export const toRegistrationStatus = (
  status: ZiinaPaymentIntentStatus | string | undefined,
): "confirmed" | "pending" | "cancelled" | null => {
  switch (status) {
    case "completed":
      return "confirmed";
    case "failed":
    case "canceled":
      return "cancelled";
    case "requires_payment_instrument":
    case "requires_user_action":
    case "pending":
      return "pending";
    default:
      return null;
  }
};

export const isZiinaWebhookIp = (ip: string | null): boolean => {
  if (!ip) return false;
  return ["3.29.184.186", "3.29.190.95", "20.233.47.127", "13.202.161.181"].includes(
    ip.trim(),
  );
};

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

const toHex = (buffer: ArrayBuffer): string =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const computeHmacHex = async (body: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return toHex(digest);
};

export const verifyHmacSignature = async (
  body: string,
  secret: string,
  signature: string | null,
): Promise<boolean> => {
  if (!body || !signature) return false;
  const expected = await computeHmacHex(body, secret);
  return timingSafeEqual(expected, signature.toLowerCase());
};
