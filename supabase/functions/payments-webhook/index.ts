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
  if (!intent.id) return;
  const nextStatus = toRegistrationStatus(intent.status);
  if (!nextStatus) return;

  const { data: reg } = await getSupabase()
    .from("registrations")
    .select("id, status, user_id")
    .eq("payment_intent_id", intent.id)
    .maybeSingle();
  if (!reg) return;

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
    const event = await verifyZiinaWebhook(body, req.headers.get("X-Hmac-Signature"));

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
