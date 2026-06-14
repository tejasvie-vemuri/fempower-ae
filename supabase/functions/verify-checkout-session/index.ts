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
      await supabaseAdmin.functions.invoke("send-transactional-email", {
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
) {
  const nextStatus = toRegistrationStatus(intent.status);
  if (!nextStatus) return;

  const { data: reg } = await supabaseAdmin
    .from("registrations")
    .select("id, status, user_id")
    .eq("payment_intent_id", intent.id)
    .maybeSingle();

  if (!reg || reg.user_id !== userId) {
    throw new Error("Payment intent does not belong to user");
  }

  if (nextStatus === "confirmed") {
    await supabaseAdmin
      .from("registrations")
      .update({
        status: "confirmed",
        amount_paid_cents: intent.amount ?? 0,
        currency: String(intent.currency_code ?? "AED").toUpperCase(),
        payment_provider: "ziina",
        payment_intent_id: intent.id,
      })
      .eq("id", reg.id);
    if (reg.status !== "confirmed") {
      await sendConfirmationEmail(supabaseAdmin, reg.id, userId);
    }
    return;
  }

  await supabaseAdmin
    .from("registrations")
    .update({
      status: nextStatus,
      payment_provider: "ziina",
      payment_intent_id: intent.id,
    })
    .eq("id", reg.id);
}

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
    const paymentIntentId: string | undefined = body.payment_intent_id;
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: "payment_intent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const intent = await getPaymentIntent(paymentIntentId);
    await confirmIfCompleted(supabaseAdmin, intent, userId);

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
