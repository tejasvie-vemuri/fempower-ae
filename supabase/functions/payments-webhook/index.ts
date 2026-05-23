import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any) {
  const meta = session.metadata ?? {};
  if (!meta.registration_id) return;
  await getSupabase()
    .from("registrations")
    .update({
      status: "confirmed",
      amount_paid_cents: session.amount_total ?? 0,
      currency: (session.currency ?? "aed").toUpperCase(),
      stripe_payment_intent_id: session.payment_intent ?? null,
      stripe_session_id: session.id,
    })
    .eq("id", meta.registration_id);
}

async function handleChargeRefunded(charge: any) {
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;
  await getSupabase()
    .from("registrations")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId);
}

async function handlePaymentFailed(paymentIntent: any) {
  await getSupabase()
    .from("registrations")
    .update({ status: "pending" })
    .eq("stripe_payment_intent_id", paymentIntent.id);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
