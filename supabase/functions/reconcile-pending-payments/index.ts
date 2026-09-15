import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getPaymentIntent,
  toRegistrationStatus,
  type ZiinaPaymentIntent,
} from "../_shared/ziina.ts";

// Self-healing backstop for paid registrations that never got confirmed.
//
// A paid sign-up is created as `pending` and flipped to `confirmed` by either
// the Ziina webhook or the return-to-site verify call. If BOTH miss (webhook
// misconfigured/rejected, or the payer never returns cleanly) the row is stuck
// on `pending` even though the money was captured. This job runs on a schedule,
// re-checks every stale pending Ziina registration against Ziina's API, and
// reconciles the status — recovering payments the live paths dropped.

const GRACE_MINUTES = 5; // don't fight the live webhook/verify paths
const BATCH_LIMIT = 200;

async function sendConfirmationEmail(
  admin: ReturnType<typeof createClient>,
  registrationId: string,
) {
  try {
    const { data: reg } = await admin
      .from("registrations")
      .select("id, ticket_code, quantity, event_id, user_id, guest_name, guest_email")
      .eq("id", registrationId)
      .maybeSingle();
    if (!reg) return;

    let email = (reg.guest_email as string | null) ?? null;
    let name = (reg.guest_name as string | null) ?? null;
    if (reg.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, name")
        .eq("user_id", reg.user_id)
        .maybeSingle();
      email = (profile?.email as string | null) ?? email;
      name = (profile?.name as string | null) ?? name;
    }

    const { data: ev } = await admin
      .from("events")
      .select("title, slug, starts_at, location")
      .eq("id", reg.event_id)
      .maybeSingle();

    if (email && ev) {
      await admin.functions.invoke("send-app-email", {
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
    console.warn("reconcile: confirmation email failed", registrationId, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Gate: only the scheduled cron (or an admin with the secret) may run this.
  const cronSecret = Deno.env.get("RECONCILE_CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - GRACE_MINUTES * 60_000).toISOString();
  const { data: pending, error: pendErr } = await admin
    .from("registrations")
    .select("id, status, payment_intent_id, user_id")
    .eq("status", "pending")
    .eq("payment_provider", "ziina")
    .not("payment_intent_id", "is", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (pendErr) {
    console.error("reconcile: failed to load pending registrations", pendErr);
    return new Response(JSON.stringify({ error: pendErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = {
    scanned: pending?.length ?? 0,
    confirmed: 0,
    cancelled: 0,
    still_pending: 0,
    errors: 0,
  };

  for (const reg of pending ?? []) {
    const intentId = reg.payment_intent_id as string;
    try {
      const intent = (await getPaymentIntent(intentId)) as ZiinaPaymentIntent;
      const nextStatus = toRegistrationStatus(intent.status);

      if (nextStatus === "confirmed") {
        const { error: updErr } = await admin
          .from("registrations")
          .update({
            status: "confirmed",
            amount_paid_cents: intent.amount ?? 0,
            currency: String(intent.currency_code ?? "AED").toUpperCase(),
            payment_provider: "ziina",
          })
          .eq("id", reg.id)
          .eq("status", "pending"); // guard against a concurrent webhook confirm
        if (updErr) throw updErr;
        await sendConfirmationEmail(admin, reg.id as string);
        summary.confirmed += 1;
        console.log("reconcile: confirmed", reg.id, intentId);
      } else if (nextStatus === "cancelled") {
        const { error: updErr } = await admin
          .from("registrations")
          .update({ status: "cancelled", payment_provider: "ziina" })
          .eq("id", reg.id)
          .eq("status", "pending");
        if (updErr) throw updErr;
        summary.cancelled += 1;
      } else {
        // Still pending/awaiting action at Ziina — leave it for the next run.
        summary.still_pending += 1;
      }
    } catch (e) {
      summary.errors += 1;
      console.error("reconcile: failed for registration", reg.id, intentId, e);
    }
  }

  console.log("reconcile: summary", summary);
  return new Response(JSON.stringify({ ok: true, ...summary }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
