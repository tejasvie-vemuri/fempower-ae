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
) {
  try {
    const { data: reg } = await supabaseAdmin
      .from("registrations")
      .select("id, ticket_code, quantity, event_id, user_id, guest_name, guest_email")
      .eq("id", registrationId)
      .maybeSingle();
    if (!reg) return;

    let email = (reg.guest_email as string | null) ?? null;
    let name = (reg.guest_name as string | null) ?? null;
    if (reg.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, name")
        .eq("user_id", reg.user_id)
        .maybeSingle();
      email = (profile?.email as string | null) ?? email;
      name = (profile?.name as string | null) ?? name;
    }

    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("title, slug, starts_at, location")
      .eq("id", reg.event_id)
      .maybeSingle();

    if (email && ev) {
      await supabaseAdmin.functions.invoke("send-app-email", {
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

async function confirmIfCompleted(
  supabaseAdmin: ReturnType<typeof createClient>,
  intent: ZiinaPaymentIntent,
  userId: string | null,
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
  if (!reg) {
    throw new Error("Registration not found");
  }
  // Ownership: a signed-in user may only confirm their own registration; a guest
  // (no session) may only confirm a guest registration (user_id is null) and
  // must identify it by its unguessable registration_id.
  if (userId) {
    if (reg.user_id !== userId) {
      throw new Error("Payment intent does not belong to user");
    }
  } else {
    if (reg.user_id !== null || !registrationId) {
      throw new Error("Payment intent does not belong to guest");
    }
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
      await sendConfirmationEmail(supabaseAdmin, reg.id);
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
    // Auth is optional: signed-in members carry a real user token, guests carry
    // only the anon key (no `sub`). Guests confirm by registration_id instead.
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claimsData } = await supabaseUser.auth.getClaims(
        authHeader.replace("Bearer ", ""),
      );
      const sub = claimsData?.claims?.sub;
      if (typeof sub === "string" && sub.length > 0) userId = sub;
    }

    const body = await req.json().catch(() => ({}));
    let paymentIntentId = cleanPaymentIntentId(body.payment_intent_id);
    const registrationId = typeof body.registration_id === "string" ? body.registration_id : undefined;
    const eventId = typeof body.event_id === "string" ? body.event_id : undefined;

    // A guest has no session, so they cannot be identified by event_id alone —
    // require the registration_id that was carried on the checkout return URL.
    if (!userId && !registrationId) {
      return new Response(JSON.stringify({ error: "registration_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const ownershipOk = userId ? reg?.user_id === userId : reg?.user_id === null;
      if (!reg || !ownershipOk) {
        return new Response(JSON.stringify({ error: "Registration does not belong to requester" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      paymentIntentId = cleanPaymentIntentId(reg.payment_intent_id);
    }

    if (!paymentIntentId && eventId && userId) {
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
