import {
  buildPaymentIntentPayload,
  buildRefundPayload,
  isZiinaWebhookIp,
  toRegistrationStatus,
  verifyHmacSignature,
  type ZiinaPaymentIntentStatus,
} from "./ziina-core.ts";

export {
  buildPaymentIntentPayload,
  buildRefundPayload,
  isZiinaWebhookIp,
  toRegistrationStatus,
  verifyHmacSignature,
};
export type { ZiinaPaymentIntentStatus };

export interface ZiinaPaymentIntent {
  id: string;
  account_id?: string;
  amount: number;
  tip_amount?: number;
  currency_code: string;
  created_at?: string;
  status?: ZiinaPaymentIntentStatus;
  operation_id?: string;
  fee_amount?: number;
  message?: string;
  redirect_url?: string;
  embedded_url?: string;
  success_url?: string;
  cancel_url?: string;
  latest_error?: {
    message?: string;
    code?: string;
  };
  allow_tips?: boolean;
}

export interface ZiinaRefund {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency_code: string;
  status?: "pending" | "completed" | "failed";
  created_at?: string;
  error?: {
    message?: string;
    code?: string;
  };
}

export interface ZiinaWebhookEvent {
  event: "payment_intent.status.updated" | "refund.status.updated" | string;
  data: Record<string, unknown>;
}

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export const getZiinaTestMode = (): boolean =>
  Deno.env.get("ZIINA_TEST_MODE")?.toLowerCase() !== "false";

export const getPublicSiteUrl = (fallback = ""): string => {
  const configured = Deno.env.get("PUBLIC_SITE_URL")?.trim();
  const value = configured || fallback;
  if (!value) throw new Error("PUBLIC_SITE_URL is not configured");
  return value.replace(/\/+$/, "");
};

const ziinaFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`${ZIINA_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getEnv("ZIINA_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      payload?.error?.message ??
      payload?.error ??
      payload?.message ??
      `Ziina API request failed with ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
};

export const createPaymentIntent = (body: {
  amount: number;
  currency_code: string;
  message: string;
  success_url: string;
  cancel_url: string;
  failure_url: string;
  operation_id: string;
  test?: boolean;
  allow_tips?: boolean;
}): Promise<ZiinaPaymentIntent> =>
  ziinaFetch<ZiinaPaymentIntent>("/payment_intent", {
    method: "POST",
    body: JSON.stringify(
      buildPaymentIntentPayload({
        ...body,
        test: body.test ?? getZiinaTestMode(),
      }),
    ),
  });

export const getPaymentIntent = (id: string): Promise<ZiinaPaymentIntent> =>
  ziinaFetch<ZiinaPaymentIntent>(`/payment_intent/${encodeURIComponent(id)}`);

export const createRefund = (body: {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency_code: string;
  test?: boolean;
}): Promise<ZiinaRefund> =>
  ziinaFetch<ZiinaRefund>("/refund", {
    method: "POST",
    body: JSON.stringify(
      buildRefundPayload({
        ...body,
        test: body.test ?? getZiinaTestMode(),
      }),
    ),
  });

export const verifyZiinaWebhook = async (
  body: string,
  signature: string | null,
): Promise<ZiinaWebhookEvent> => {
  if (!body || !signature) throw new Error("Missing Ziina webhook signature");
  const secret = getEnv("ZIINA_WEBHOOK_SECRET");
  if (!(await verifyHmacSignature(body, secret, signature))) {
    throw new Error("Invalid Ziina webhook signature");
  }
  return JSON.parse(body) as ZiinaWebhookEvent;
};
