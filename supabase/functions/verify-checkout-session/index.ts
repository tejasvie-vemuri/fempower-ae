import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getPaymentIntent,
  toRegistrationStatus,
  type ZiinaPaymentIntent,
} from "../_shared/ziina.ts";

async function sendConfirmationEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  registrationId: string,
  userId: string,
) {
  try {
    const { data: reg } = await supabaseAdmin
      .from("registrations")
      .select("id, ticket_code, quantity, event_id")
      .eq("id", registrationId)
      .maybeSingle();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: ev } = reg
      ? await supabaseAdmin
          .from("events")
          .select("title, slug, starts_at, location")
          .eq("id", reg.event_id)
          .maybeSingle()
      : { data: null };
    if (profile?.email && reg && ev) {
      await supabaseAdmin.functions.invoke("send-app-email", {
        body: {
          templateName: "event-registration-confirmation",
          recipientEmail: profile.email,
          idempotencyKey: `event-reg-${reg.id}`,
          templateData: {
            name: profile.name,
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

async function confirmIfCompleted(
  supabaseAdmin: ReturnType<typeof createClient>,
  intent: ZiinaPaymentIntent,
  userId: string,
  registrationId?: string,
) {
  const nextStatus = toRegistrationStatus(intent.status);
  if (!nextStatus) return;

  let query = supabaseAdmin
    .from("registrations")
    .select("id, status, user_id");

  query = registrationId
    ? query.eq("id", registrationId)
    : query.eq("payment_intent_id", intent.id);

  const { data: reg, error: regErr } = await query.maybeSingle();

  if (regErr) throw regErr;
  if (!reg || reg.user_id !== userId) {
    throw new Error("Payment intent does not belong to user");
  }

  if (nextStatus === "confirmed") {
    const { error: updateErr } = await supabaseAdmin
      .from("registrations")
      .update({
        status: "confirmed",
        amount_paid_cents: intent.amount ?? 0,
        currency: String(intent.currency_code ?? "AED").toUpperCase(),
        payment_provider: "ziina",
        payment_intent_id: intent.id,
      })
      .eq("id", reg.id);
    if (updateErr) throw updateErr;
    if (reg.status !== "confirmed") {
      await sendConfirmationEmail(supabaseAdmin, reg.id, userId);
    }
    return;
  }

  const { error: updateErr } = await supabaseAdmin
    .from("registrations")
    .update({
      status: nextStatus,
      payment_provider: "ziina",
      payment_intent_id: intent.id,
    })
    .eq("id", reg.id);
  if (updateErr) throw updateErr;
}

const cleanPaymentIntentId = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("{") || trimmed.includes("}")) return undefined;
  return trimmed;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    let paymentIntentId = cleanPaymentIntentId(body.payment_intent_id);
    const registrationId = typeof body.registration_id === "string" ? body.registration_id : undefined;
    const eventId = typeof body.event_id === "string" ? body.event_id : undefined;
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!paymentIntentId && registrationId) {
      const { data: reg, error: regErr } = await supabaseAdmin
        .from("registrations")
        .select("payment_intent_id, user_id")
        .eq("id", registrationId)
        .maybeSingle();
      if (regErr) throw regErr;
      if (!reg || reg.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Registration does not belong to user" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      paymentIntentId = cleanPaymentIntentId(reg.payment_intent_id);
    }

    if (!paymentIntentId && eventId) {
      const { data: regs, error: regsErr } = await supabaseAdmin
        .from("registrations")
        .select("payment_intent_id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .eq("payment_provider", "ziina")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (regsErr) throw regsErr;
      paymentIntentId = cleanPaymentIntentId(regs?.[0]?.payment_intent_id);
    }

    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: "payment_intent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const intent = await getPaymentIntent(paymentIntentId);
    await confirmIfCompleted(supabaseAdmin, intent, userId, registrationId);

    return new Response(
      JSON.stringify({
        paid: intent.status === "completed",
        payment_status: intent.status ?? "unknown",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("verify-checkout-session error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
