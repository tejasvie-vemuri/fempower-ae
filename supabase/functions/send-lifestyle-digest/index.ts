import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// UAE is UTC+4 year round, no DST, safe to hardcode the offset.
const UAE_OFFSET_MS = 4 * 60 * 60 * 1000;

function uaeNow() {
  return new Date(Date.now() + UAE_OFFSET_MS);
}

function uaeDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Buckets "HH:MM" down to the 15-minute window this cron tick covers.
function bucket(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h}:${Math.floor((m ?? 0) / 15) * 15}`;
}

function currentBucket(now: Date) {
  return `${now.getUTCHours()}:${Math.floor(now.getUTCMinutes() / 15) * 15}`;
}

interface PersonRow {
  id: string;
  name: string;
}

function isDateDueToday(dateStr: string, recurrence: string, leadDays: number[], today: Date): boolean {
  const target = new Date(dateStr + "T00:00:00Z");
  for (const lead of leadDays) {
    const check = new Date(today);
    check.setUTCDate(check.getUTCDate() + lead);
    if (recurrence === "yearly") {
      if (check.getUTCMonth() === target.getUTCMonth() && check.getUTCDate() === target.getUTCDate()) return true;
    } else {
      if (uaeDateString(check) === uaeDateString(target)) return true;
    }
  }
  return false;
}

function daysUntilLabel(dateStr: string, recurrence: string, today: Date): string {
  const target = new Date(dateStr + "T00:00:00Z");
  const comparison = recurrence === "yearly" ? new Date(Date.UTC(today.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())) : target;
  const diffDays = Math.round((comparison.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("DIGEST_CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails("mailto:hello@fempowerae.com", vapidPublic, vapidPrivate);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const now = uaeNow();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayStr = uaeDateString(today);
  const nowBucket = currentBucket(now);

  const { data: profiles, error: profilesErr } = await admin
    .from("lm_profile")
    .select("user_id, assistant_name, preferred_name, notification_prefs, last_digest_sent_date");

  if (profilesErr) {
    console.error("Failed to load lm_profile rows:", profilesErr);
    return new Response(JSON.stringify({ error: profilesErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sentCount = 0;
  let skippedCount = 0;

  for (const profile of profiles ?? []) {
    const prefs = profile.notification_prefs ?? { whatsapp: true, email: false, digest_time: "08:00" };
    const digestTime = prefs.digest_time ?? "08:00";

    if (bucket(digestTime) !== nowBucket) continue;
    if (profile.last_digest_sent_date === todayStr) continue;

    const [{ data: reminders }, { data: dates }] = await Promise.all([
      admin
        .from("reminders")
        .select("id, title, due_date")
        .eq("user_id", profile.user_id)
        .eq("status", "pending")
        .lte("due_date", todayStr),
      admin
        .from("important_dates")
        .select("id, label, date, recurrence, reminder_lead_days, person_id")
        .eq("user_id", profile.user_id),
    ]);

    const items: string[] = [];
    for (const r of reminders ?? []) {
      if (!r.due_date) continue;
      items.push(`${r.title}, due today`);
    }

    const duePeople = (dates ?? []).filter((d) =>
      isDateDueToday(d.date, d.recurrence, d.reminder_lead_days ?? [0], today)
    );
    if (duePeople.length > 0) {
      const personIds = [...new Set(duePeople.map((d) => d.person_id))];
      const { data: people } = await admin.from("people").select("id, name").eq("user_id", profile.user_id).in("id", personIds);
      const peopleMap = new Map<string, string>((people ?? []).map((p: PersonRow) => [p.id, p.name]));
      for (const d of duePeople) {
        const name = peopleMap.get(d.person_id) ?? "someone";
        items.push(`${name}'s ${d.label} is ${daysUntilLabel(d.date, d.recurrence, today)}`);
      }
    }

    if (items.length === 0) {
      skippedCount++;
      continue;
    }

    // Web push
    if (prefs.web_push) {
      const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", profile.user_id);
      for (const sub of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: `${profile.assistant_name || "Zoya"} has something for you`,
              body: items[0] + (items.length > 1 ? ` (+${items.length - 1} more)` : ""),
              url: "/lifestyle-manager",
            })
          );
        } catch (e) {
          const status = (e as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error("Web push failed:", profile.user_id, e);
          }
        }
      }
    }

    // Email
    if (prefs.email) {
      const { data: userRes } = await admin.auth.admin.getUserById(profile.user_id);
      const recipient = userRes?.user?.email;
      if (recipient) {
        try {
          await admin.functions.invoke("send-app-email", {
            body: {
              templateName: "lifestyle-digest",
              recipientEmail: recipient,
              idempotencyKey: `lifestyle-digest-${profile.user_id}-${todayStr}`,
              templateData: {
                preferredName: profile.preferred_name,
                assistantName: profile.assistant_name,
                siteUrl: "https://fempowerae.com",
                items,
              },
            },
            headers: { Authorization: `Bearer ${serviceKey}` },
          });
        } catch (e) {
          console.error("Digest email failed:", profile.user_id, e);
        }
      }
    }

    await admin.from("lm_profile").update({ last_digest_sent_date: todayStr }).eq("user_id", profile.user_id);
    sentCount++;
  }

  return new Response(JSON.stringify({ sent: sentCount, skipped: skippedCount }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
