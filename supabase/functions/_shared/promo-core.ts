export interface PromoRule {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  event_id: string | null;
  expires_at: string | null;
  members_only: boolean;
  is_active: boolean;
}

export function promoQuote(rule: PromoRule | null, eventId: string, subtotal: number, currency: string, isMember: boolean, now = Date.now()) {
  // Members-only codes look exactly like unknown codes to non-members, so
  // anonymous callers can't discover them or their discount.
  if (!rule || !rule.is_active || (rule.members_only && !isMember)) throw new Error("Invalid or inactive promo code");
  if (rule.expires_at && new Date(rule.expires_at).getTime() <= now) throw new Error("This promo code has expired");
  if (rule.event_id && rule.event_id !== eventId) throw new Error("This promo code is for another event");
  if (subtotal <= 0) throw new Error("Promo codes apply to paid events only");
  if (rule.discount_type === "fixed" && currency.toUpperCase() !== "AED") throw new Error("This promo code applies to AED tickets only");
  const discount = Math.min(subtotal, rule.discount_type === "percentage" ? Math.round(subtotal * rule.discount_value / 100) : rule.discount_value);
  return { code: rule.code, promo_code_id: rule.id, subtotal_cents: subtotal, discount_cents: discount, total_cents: subtotal - discount };
}

export function assertCheckoutPayment(reg: { payment_intent_id?: string | null; checkout_amount_cents?: number | null; currency: string }, intent: { id: string; amount?: number; currency_code?: string }) {
  if (reg.payment_intent_id !== intent.id) throw new Error("Payment does not match this checkout");
  if (reg.checkout_amount_cents != null && (intent.amount !== reg.checkout_amount_cents || intent.currency_code?.toUpperCase() !== reg.currency.toUpperCase())) throw new Error("Payment amount does not match this checkout");
}