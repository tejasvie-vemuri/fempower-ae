import { createClient } from "npm:@supabase/supabase-js@2";
import {
  isZiinaWebhookIp,
  toRegistrationStatus,
  verifyZiinaWebhook,
  type ZiinaPaymentIntent,
  type ZiinaRefund,
} from "../_shared/ziina.ts";

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

async function sendConfirmationEmail(registrationId: string) {
  try {
    const supabase = getSupabase();
    const { data: reg } = await supabase
      .from("registrations")
      .select("id, ticket_code, quantity, event_id, user_id, guest_name, guest_email")
      .eq("id", registrationId)
      .maybeSingle();
    if (!reg) return;

    // Members are emailed at their account address; guests at the address they
    // typed into the registration form.
    let email = (reg.guest_email as string | null) ?? null;
    let name = (reg.guest_name as string | null) ?? null;
    if (reg.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("user_id", reg.user_id)
        .maybeSingle();
      email = (profile?.email as string | null) ?? email;
      name = (profile?.name as string | null) ?? name;
    }

    const { data: ev } = await supabase
      .from("events")
      .select("title, slug, starts_at, location")
      .eq("id", reg.event_id)
      .maybeSingle();

    if (email && ev) {
      await supabase.functions.invoke("send-app-email", {
        body: {
          templateName: "event-registration-confirmation",
          recipientEmail: email,
          idempotencyKey: `event-reg-${reg.id}`,
          templateData: {
            name,
            eventTitle: ev.title,
            startsAt: ev.starts_at,
            location: ev.location,
            ticketCode: reg.ticket_code,
            quantity: reg.quantity,
            eventUrl: `https://fempowerae.com/events/${ev.slug}`,
          },
        },
      });
    }
  } catch (e) {
    console.warn("Failed to send registration confirmation email", e);
  }
}

async function handlePaymentIntentStatus(intent: ZiinaPaymentIntent) {
  if (!intent.id) {
    console.warn("Ziina webhook: payment intent missing id, ignoring", intent);
    return;
  }
  const nextStatus = toRegistrationStatus(intent.status);
  if (!nextStatus) {
    // An unmapped status silently dropping confirmations is exactly how paid
    // sign-ups get stuck on pending — surface it so it's diagnosable.
    console.error("Ziina webhook: UNKNOWN payment status, no action taken", {
      intentId: intent.id,
      status: intent.status,
    });
    return;
  }

  const { data: reg } = await getSupabase()
    .from("registrations")
    .select("id, status, user_id")
    .eq("payment_intent_id", intent.id)
    .maybeSingle();
  if (!reg) {
    // No row matches this intent — usually the payment_intent_id write lost a
    // race or failed. Reconciliation cannot catch this either (it also matches
    // by intent id), so it must be logged for manual follow-up.
    console.error("Ziina webhook: no registration for payment_intent_id", {
      intentId: intent.id,
      status: intent.status,
    });
    return;
  }

  if (nextStatus === "confirmed") {
    const { error } = await getSupabase()
      .from("registrations")
      .update({
        status: "confirmed",
        amount_paid_cents: intent.amount ?? 0,
        currency: String(intent.currency_code ?? "AED").toUpperCase(),
        payment_provider: "ziina",
        payment_intent_id: intent.id,
      })
      .eq("id", reg.id);
    if (error) throw error;
    if (reg.status !== "confirmed") {
      await sendConfirmationEmail(reg.id);
    }
    return;
  }

  const { error } = await getSupabase()
    .from("registrations")
    .update({
      status: nextStatus,
      payment_provider: "ziina",
      payment_intent_id: intent.id,
    })
    .eq("id", reg.id);
  if (error) throw error;
}

async function handleRefundStatus(refund: ZiinaRefund) {
  if (!refund.payment_intent_id) return;
  if (refund.status !== "completed") return;
  const { error } = await getSupabase()
    .from("registrations")
    .update({
      status: "refunded",
      refund_id: refund.id,
      payment_provider: "ziina",
    })
    .eq("payment_intent_id", refund.payment_intent_id);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawIp =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip");
    if (!isZiinaWebhookIp(rawIp)) {
      console.warn("Ziina webhook IP could not be verified", { ip: rawIp ?? "unknown" });
    }

    const body = await req.text();

    let event;
    try {
      event = await verifyZiinaWebhook(body, req.headers.get("X-Hmac-Signature"));
    } catch (verifyErr) {
      // A signature/secret mismatch rejects EVERY webhook, which silently breaks
      // all payment confirmations. Log loudly with the source IP so a
      // misconfigured ZIINA_WEBHOOK_SECRET is obvious in the logs.
      console.error("Ziina webhook: signature verification FAILED", {
        ip: rawIp ?? "unknown",
        hasSignature: !!req.headers.get("X-Hmac-Signature"),
        error: verifyErr instanceof Error ? verifyErr.message : String(verifyErr),
      });
      return new Response("Invalid signature", { status: 400 });
    }

    switch (event.event) {
      case "payment_intent.status.updated":
        await handlePaymentIntentStatus(event.data as unknown as ZiinaPaymentIntent);
        break;
      case "refund.status.updated":
        await handleRefundStatus(event.data as unknown as ZiinaRefund);
        break;
      default:
        console.log("Unhandled Ziina event:", event.event);
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
