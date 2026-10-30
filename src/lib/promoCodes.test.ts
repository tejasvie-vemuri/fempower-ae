import { promoQuote, assertCheckoutPayment, type PromoRule } from "../../supabase/functions/_shared/promo-core";
const rule: PromoRule = { id: "promo", code: "SAVE", discount_type: "percentage", discount_value: 20, event_id: null, expires_at: null, members_only: false, is_active: true };
describe("event promo codes", () => {
  it("applies percentage discounts", () => expect(promoQuote(rule, "event", 2900, "AED", false).total_cents).toBe(2320));
  it("applies fixed AED discounts once to the booking total", () => expect(promoQuote({ ...rule, discount_type: "fixed", discount_value: 1000 }, "event", 5800, "AED", false).total_cents).toBe(4800));
  it("supports event-specific codes", () => expect(() => promoQuote({ ...rule, event_id: "other" }, "event", 2900, "AED", false)).toThrow("another event"));
  it("supports all-event codes", () => expect(promoQuote(rule, "any-event", 2900, "AED", false).discount_cents).toBe(580));
  it("rejects expired codes", () => expect(() => promoQuote({ ...rule, expires_at: "2026-10-25T16:00:00Z" }, "event", 2900, "AED", false, Date.parse("2026-10-25T16:34:00Z"))).toThrow("expired"));
  it("rejects guest use of members-only codes", () => expect(() => promoQuote({ ...rule, members_only: true }, "event", 2900, "AED", false)).toThrow("Invalid or inactive"));
  it("allows approved members to use members-only codes", () => expect(promoQuote({ ...rule, members_only: true }, "event", 2900, "AED", true).total_cents).toBe(2320));
  it("caps discounts at the total", () => expect(promoQuote({ ...rule, discount_type: "fixed", discount_value: 5000 }, "event", 2900, "AED", false).total_cents).toBe(0));
  it("rejects inactive codes", () => expect(() => promoQuote({ ...rule, is_active: false }, "event", 2900, "AED", false)).toThrow("inactive"));
  it("rejects mismatched paid amounts", () => expect(() => assertCheckoutPayment({ payment_intent_id: "pi", checkout_amount_cents: 2320, currency: "AED" }, { id: "pi", amount: 100, currency_code: "AED" })).toThrow("amount"));
  it("accepts the stored discounted payment", () => expect(() => assertCheckoutPayment({ payment_intent_id: "pi", checkout_amount_cents: 2320, currency: "AED" }, { id: "pi", amount: 2320, currency_code: "AED" })).not.toThrow());
});