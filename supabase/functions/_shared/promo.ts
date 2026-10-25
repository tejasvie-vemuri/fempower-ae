import { createClient } from "npm:@supabase/supabase-js@2";
import { promoQuote } from "./promo-core.ts";

export async function resolvePromo(db: ReturnType<typeof createClient>, raw: unknown, event: { id: string; price_cents: number; currency: string }, quantity: number, userId: string | null) {
  const subtotal = event.price_cents * quantity;
  if (raw == null || raw === "") return { code: null, promo_code_id: null, subtotal_cents: subtotal, discount_cents: 0, total_cents: subtotal };
  if (typeof raw !== "string" || !/^[A-Z0-9_-]{2,40}$/i.test(raw.trim())) throw new Error("Invalid promo code");
  const { data, error } = await db.from("event_promo_codes").select("*").eq("code", raw.trim().toUpperCase()).maybeSingle();
  if (error) throw new Error("Could not check promo code");
  let member = false;
  if (data?.members_only && userId) {
    const result = await db.rpc("is_approved_member", { _user_id: userId });
    member = !result.error && result.data === true;
  }
  return promoQuote(data, event.id, subtotal, event.currency, member);
}