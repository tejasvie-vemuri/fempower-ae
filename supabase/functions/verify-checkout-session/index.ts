import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const isStripeEnv = (v: unknown): v is StripeEnv => v === "sandbox" || v === "live";

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
    const sessionId: string | undefined = body.session_id;
    const environment: StripeEnv = isStripeEnv(body.environment) ? body.environment : "sandbox";
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(environment);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    const meta = (session.metadata ?? {}) as Record<string, string>;
    if (meta.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Session does not belong to user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (paid && meta.registration_id) {
      await supabaseAdmin
        .from("registrations")
        .update({
          status: "confirmed",
          amount_paid_cents: session.amount_total ?? 0,
          currency: (session.currency ?? "aed").toUpperCase(),
          stripe_payment_intent_id: (session.payment_intent as string) ?? null,
          stripe_session_id: session.id,
        })
        .eq("id", meta.registration_id);

      // Send confirmation email (paid registration)
      try {
        const { data: reg } = await supabaseAdmin
          .from("registrations")
          .select("id, ticket_code, quantity, event_id")
          .eq("id", meta.registration_id)
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

    return new Response(
      JSON.stringify({ paid, payment_status: session.payment_status }),
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
