import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/stripe/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const STRIPE_API_KEY = Deno.env.get("STRIPE_SANDBOX_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!STRIPE_API_KEY) throw new Error("STRIPE_SANDBOX_API_KEY is not configured");

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
    const userEmail = (claimsData.claims.email as string) ?? "";

    const body = await req.json().catch(() => ({}));
    const eventId: string | undefined = body.event_id;
    const origin: string =
      body.origin ?? req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    if (!eventId) {
      return new Response(JSON.stringify({ error: "event_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to read event + write pending registration regardless of RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: ev, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id, slug, title, price_cents, currency, capacity, status, waitlist_enabled")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !ev) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ev.status !== "published") {
      return new Response(JSON.stringify({ error: "Event is not open for registration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ev.price_cents <= 0) {
      return new Response(JSON.stringify({ error: "Event is free — use direct registration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check capacity
    if (ev.capacity > 0) {
      const { count } = await supabaseAdmin
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", ev.id)
        .eq("status", "confirmed");
      if ((count ?? 0) >= ev.capacity) {
        return new Response(JSON.stringify({ error: "Event is sold out" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create or reuse a pending registration
    const { data: existingReg } = await supabaseAdmin
      .from("registrations")
      .select("id, status")
      .eq("event_id", ev.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReg?.status === "confirmed") {
      return new Response(JSON.stringify({ error: "You are already registered" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let registrationId = existingReg?.id;
    if (!registrationId) {
      const { data: reg, error: regErr } = await supabaseAdmin
        .from("registrations")
        .insert({
          event_id: ev.id,
          user_id: userId,
          status: "pending",
          amount_paid_cents: 0,
          currency: ev.currency,
        })
        .select("id")
        .single();
      if (regErr || !reg) {
        return new Response(JSON.stringify({ error: regErr?.message ?? "Failed to create registration" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      registrationId = reg.id;
    }

    const successUrl = `${origin}/events/${ev.slug}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/events/${ev.slug}?checkout=cancelled`;

    // Build x-www-form-urlencoded body for Stripe API
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    if (userEmail) params.append("customer_email", userEmail);
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", ev.currency.toLowerCase());
    params.append("line_items[0][price_data][unit_amount]", String(ev.price_cents));
    params.append("line_items[0][price_data][product_data][name]", ev.title);
    params.append("metadata[event_id]", ev.id);
    params.append("metadata[user_id]", userId);
    params.append("metadata[registration_id]", registrationId!);

    const stripeRes = await fetch(`${GATEWAY_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": STRIPE_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const stripeData = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe error:", stripeRes.status, stripeData);
      return new Response(
        JSON.stringify({ error: `Stripe error: ${JSON.stringify(stripeData)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Save session id on the registration
    await supabaseAdmin
      .from("registrations")
      .update({ stripe_session_id: stripeData.id })
      .eq("id", registrationId!);

    return new Response(
      JSON.stringify({ url: stripeData.url, session_id: stripeData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("create-checkout-session error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
