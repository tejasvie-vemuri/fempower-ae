import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const isStripeEnv = (value: unknown): value is StripeEnv =>
  value === "sandbox" || value === "live";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const userEmail = (claimsData.claims.email as string) ?? "";

    const body = await req.json().catch(() => ({}));
    const eventId: string | undefined = body.event_id;
    const environment: StripeEnv = isStripeEnv(body.environment) ? body.environment : "sandbox";
    const origin: string =
      body.origin ?? req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    const rawResponses =
      body.responses && typeof body.responses === "object" && !Array.isArray(body.responses)
        ? (body.responses as Record<string, unknown>)
        : {};
    const responses: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawResponses)) {
      if (typeof k === "string" && k.length <= 64) {
        const s = typeof v === "string" ? v : String(v ?? "");
        responses[k] = s.slice(0, 1000);
      }
    }
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
          responses,
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
    } else {
      // Update responses on existing pending registration so admin always has latest answers
      await supabaseAdmin
        .from("registrations")
        .update({ responses })
        .eq("id", registrationId);
    }

    const stripe = createStripeClient(environment);
    const customerId = await resolveOrCreateCustomer(stripe, {
      email: userEmail,
      userId,
    });
    const stripeData = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      redirect_on_completion: "never",
      customer: customerId,
      customer_update: { address: "auto", name: "auto" },
      automatic_tax: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: ev.currency.toLowerCase(),
            unit_amount: ev.price_cents,
            product_data: {
              name: ev.title,
              tax_code: "txcd_20030000",
            },
            tax_behavior: "inclusive",
          },
        },
      ],
      payment_intent_data: { description: ev.title },
      metadata: {
        event_id: ev.id,
        user_id: userId,
        registration_id: registrationId!,
      },
    });


    // Save session id on the registration
    await supabaseAdmin
      .from("registrations")
      .update({ stripe_session_id: stripeData.id })
      .eq("id", registrationId!);

    return new Response(
      JSON.stringify({ clientSecret: stripeData.client_secret, session_id: stripeData.id }),
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
