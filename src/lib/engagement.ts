import { supabase } from "@/integrations/supabase/client";

export type EngagementEventType =
  | "event_rsvp"
  | "circle_post"
  | "circle_reply"
  | "meetup_host"
  | "meetup_rsvp"
  | "learn_wing_completed"
  | "directory_profile_viewed"
  | "whatsapp_cta_click"
  | "digest_click"
  | "intro_posted"
  | "zara_checklist_started"
  | "zara_share_click";

/** Event types that can be logged without an authenticated member (top-of-funnel). */
const ANONYMOUS_ALLOWED: ReadonlySet<EngagementEventType> = new Set([
  "whatsapp_cta_click",
  "digest_click",
  "zara_checklist_started",
  "zara_share_click",
]);

/**
 * Persist a client-side engagement signal. Best-effort — never throws.
 * DB triggers already log the server-owned events (rsvps, posts, replies, etc.),
 * so this helper is only used for view/interaction signals not backed by
 * a table insert (Directory profile viewed, WhatsApp CTA click, digest UTM click).
 *
 * Anonymous visitors are logged with `user_id = null` for the allow-listed
 * top-of-funnel event types; all other types stay member-only.
 */
export const logEngagement = async (
  eventType: EngagementEventType,
  targetId?: string | null,
  metadata: Record<string, unknown> = {},
) => {
  try {
    const { data: sess } = await supabase.auth.getUser();
    const userId = sess?.user?.id ?? null;
    if (!userId && !ANONYMOUS_ALLOWED.has(eventType)) return;
    await supabase.from("engagement_events").insert([
      {
        user_id: userId,
        event_type: eventType,
        target_id: targetId ?? null,
        metadata: metadata as never,
      },
    ]);
  } catch {
    /* engagement is best-effort */
  }
};

