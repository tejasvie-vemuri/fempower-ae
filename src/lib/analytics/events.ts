/**
 * The Fempower event taxonomy.
 *
 * One flat, snake_case union so every sink (Clarity, GTM dataLayer, GA,
 * Plausible) reports the same names, and so a typo fails the build instead of
 * quietly creating a second event in the dashboard.
 *
 * Naming rules:
 *   - `object_verb_past_tense` — `event_register_succeeded`, not `registerEvent`
 *   - dimensions go in props (`location`, `source`, `method`), never in the name
 *   - anything user-identifying goes in a Clarity tag, never in the name
 */
export type AnalyticsEventName =
  /* ---- lifecycle & diagnostics ---- */
  | "session_start"
  | "page_view"
  | "page_engagement"
  | "scroll_depth"
  | "web_vital"
  | "app_error"
  | "resource_blocked"

  /* ---- navigation & content ---- */
  | "nav_click"
  | "outbound_click"
  | "form_submitted"
  | "section_view"
  | "faq_opened"
  | "gallery_opened"
  | "share_clicked"
  | "download_clicked"

  /* ---- acquisition / top of funnel ---- */
  | "whatsapp_cta_click"
  | "instagram_click"
  | "linkedin_click"
  | "substack_click"
  | "join_cta_click"
  | "join_page_viewed"
  | "newsletter_signup"
  | "contact_form_opened"
  | "contact_form_submitted"
  | "invite_sister_opened"
  | "invite_sister_sent"
  | "coach_opened"
  | "coach_message_sent"

  /* ---- authentication ---- */
  | "auth_page_viewed"
  | "sign_up_submitted"
  | "sign_up_succeeded"
  | "sign_up_failed"
  | "sign_in_submitted"
  | "sign_in_succeeded"
  | "sign_in_failed"
  | "oauth_started"
  | "oauth_failed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "sign_out"
  | "pending_approval_viewed"

  /* ---- events, tickets & payments ---- */
  | "event_viewed"
  | "event_register_started"
  | "event_register_succeeded"
  | "event_register_failed"
  | "checkout_started"
  | "checkout_failed"
  | "payment_succeeded"
  | "waitlist_joined"
  | "waitlist_left"
  | "calendar_added"
  | "ticket_viewed"

  /* ---- community ---- */
  | "directory_profile_viewed"
  | "directory_filter_applied"
  | "circle_post_created"
  | "circle_reply_created"
  | "meetup_rsvp"
  | "meetup_hosted"
  | "testimonial_submitted"
  | "story_submitted"
  | "win_shared"
  | "bookmark_toggled"

  /* ---- learn ---- */
  | "learn_course_opened"
  | "learn_module_opened"
  | "learn_wing_opened"
  | "learn_wing_completed"
  | "learn_reflection_saved"

  /* ---- member account ---- */
  | "profile_updated"
  | "profile_photo_uploaded"
  | "membership_status_viewed";

/**
 * Session/user-scoped Clarity tags. Keeping the keys in a union stops the tag
 * list in the Clarity UI from drifting into `isAdmin` / `is_admin` duplicates.
 */
export type AnalyticsTagKey =
  | "auth_state"
  | "member_status"
  | "is_admin"
  | "account_age_days"
  | "auth_provider"
  | "app_section"
  | "page_path"
  | "device_type"
  | "viewport"
  | "connection"
  | "language"
  | "timezone"
  | "referrer_host"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "last_event"
  | "had_error";

/** Broad buckets used for the `app_section` tag and funnel grouping. */
export type AppSection =
  | "public"
  | "auth"
  | "events"
  | "account"
  | "directory"
  | "circle"
  | "learn"
  | "meetups"
  | "admin"
  | "legal"
  | "other";

/** Maps a route to its {@link AppSection}. */
export const sectionForPath = (pathname: string): AppSection => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/learn")) return "learn";
  if (pathname.startsWith("/circle")) return "circle";
  if (pathname.startsWith("/directory")) return "directory";
  if (pathname.startsWith("/meetups")) return "meetups";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/account")) return "account";
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/pending-approval")
  ) {
    return "auth";
  }
  if (pathname === "/privacy" || pathname === "/terms") return "legal";
  if (
    pathname === "/" ||
    pathname === "/join" ||
    pathname === "/lonely-in-dubai" ||
    pathname === "/roundtables"
  ) {
    return "public";
  }
  return "other";
};
