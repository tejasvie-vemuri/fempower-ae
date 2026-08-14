/**
 * The one analytics entry point for the app: `import { track } from "@/lib/analytics"`.
 *
 * A single `track()` call fans out to every sink we support:
 *   - Microsoft Clarity  — custom event + filterable tags (session replay)
 *   - `window.dataLayer` — GTM-compatible push, so a tag manager can be added
 *                          later without touching a single component
 *   - `gtag` / `plausible` — called only if those scripts happen to be present
 *   - `fempower:analytics` DOM event — lets other code observe without coupling
 *   - Supabase `engagement_events` — for the handful of event types the
 *                                    Northstar dashboard already reports on
 *
 * Nothing here throws and nothing here awaits: analytics must never be able to
 * break a user flow or add latency to one.
 */

import { logEngagement, type EngagementEventType } from "@/lib/engagement";
import {
  clarityEvent,
  clarityIdentify,
  claritySetTag,
  clarityUpgrade,
  initClarity,
} from "./clarity";
import {
  debugLog,
  isBrowser,
  isTrackingAllowed,
  readCampaignParams,
  redactPath,
  sanitizeProps,
  scrubText,
  type AnalyticsProps,
  type CleanProps,
} from "./config";
import {
  sectionForPath,
  type AnalyticsEventName,
  type AnalyticsTagKey,
} from "./events";

export type { AnalyticsEventName, AnalyticsTagKey, AppSection } from "./events";
export { sectionForPath } from "./events";
export {
  hasOptedOutOfTracking,
  setTrackingOptOut,
  isTrackingAllowed,
  OPT_OUT_STORAGE_KEY,
} from "./config";
export { clarityUpgrade, claritySetTag } from "./clarity";

/**
 * The only events we mirror into `engagement_events`.
 *
 * Deliberately short. Everything backed by a table insert — RSVPs, circle
 * posts and replies, meetup hosting/RSVPs, learn wings — is already written by
 * a SECURITY DEFINER trigger in the database (see the 20260717 migration), so
 * mirroring those from the client would double-count them on the Northstar
 * dashboard. This map covers only the signals no table insert can capture.
 *
 * `engagement_events.event_type` also has a CHECK constraint, so any new entry
 * here needs a migration first. Every other analytics event is Clarity-only.
 */
const ENGAGEMENT_BRIDGE: Partial<Record<AnalyticsEventName, EngagementEventType>> = {
  whatsapp_cta_click: "whatsapp_cta_click",
  directory_profile_viewed: "directory_profile_viewed",
};

/** Events important enough that we always want the replay, never a sample. */
const UPGRADE_ON: ReadonlySet<AnalyticsEventName> = new Set<AnalyticsEventName>([
  "app_error",
  "sign_up_failed",
  "sign_in_failed",
  "oauth_failed",
  "event_register_failed",
  "checkout_started",
  "checkout_failed",
  "payment_succeeded",
]);

const SESSION_ID_KEY = "fempower:analytics-session";

let initialised = false;
let currentPath = "";

/* ------------------------------------------------------------------ *
 * Session + device context
 * ------------------------------------------------------------------ */

/** Stable id for this tab's session, used to join our sinks together. */
const getSessionId = (): string => {
  if (!isBrowser()) return "";
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return "";
  }
};

/**
 * Viewport width, with fallbacks. `innerWidth` can still be 0 when init runs
 * before the first layout, and a 0 there would report every such visit as a
 * phone — so fall back to the document, then to the screen.
 */
const viewportSize = (): { width: number; height: number } => ({
  width: window.innerWidth || document.documentElement?.clientWidth || window.screen?.width || 0,
  height:
    window.innerHeight || document.documentElement?.clientHeight || window.screen?.height || 0,
});

const deviceType = (width: number): string =>
  width <= 0 ? "unknown" : width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

/** Everything worth knowing about the visitor's environment, PII-free. */
const collectContext = (): CleanProps => {
  if (!isBrowser()) return {};
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
    deviceMemory?: number;
  };
  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : "direct";
  } catch {
    referrerHost = "unknown";
  }
  const { width, height } = viewportSize();
  return sanitizeProps({
    device_type: deviceType(width),
    viewport: `${width}x${height}`,
    screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
    pixel_ratio: window.devicePixelRatio,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection: nav.connection?.effectiveType,
    save_data: nav.connection?.saveData,
    device_memory: nav.deviceMemory,
    touch: navigator.maxTouchPoints > 0,
    referrer_host: referrerHost,
    standalone: window.matchMedia?.("(display-mode: standalone)").matches,
    prefers_dark: window.matchMedia?.("(prefers-color-scheme: dark)").matches,
    ...readCampaignParams(window.location.search),
  });
};

/* ------------------------------------------------------------------ *
 * Init
 * ------------------------------------------------------------------ */

/**
 * Boots Clarity and records `session_start`. Idempotent; `track()` calls it
 * lazily so a component firing an event before <Analytics /> mounts still works.
 */
export const initAnalytics = (): void => {
  if (initialised || !isBrowser()) return;
  initialised = true;

  if (!isTrackingAllowed()) {
    debugLog("tracking disabled for this visitor");
    return;
  }

  initClarity();

  const context = collectContext();
  for (const key of ["device_type", "viewport", "connection", "language", "timezone", "referrer_host", "utm_source", "utm_medium", "utm_campaign"] as const) {
    const value = context[key];
    if (value !== undefined) claritySetTag(key as AnalyticsTagKey, value);
  }

  track("session_start", {
    ...context,
    path: redactPath(window.location.pathname, window.location.search),
    session_id: getSessionId(),
  });
};

/**
 * Every public entry point calls this, so a component that fires an event
 * before <Analytics /> has mounted still reaches a booted pipeline.
 */
const ensureInitialised = (): void => {
  if (!initialised) initAnalytics();
};

/* ------------------------------------------------------------------ *
 * Core
 * ------------------------------------------------------------------ */

interface FanOutWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  plausible?: (name: string, opts?: { props?: Record<string, unknown> }) => void;
}

/**
 * Records an event across every configured sink. Fire-and-forget: callers
 * should not await it and it never rejects.
 */
export const track = (name: AnalyticsEventName, props: AnalyticsProps = {}): void => {
  if (!isBrowser()) return;
  ensureInitialised();
  if (!isTrackingAllowed()) return;

  const clean = sanitizeProps(props);
  const payload = { event: name, ...clean, ts: new Date().toISOString() };
  debugLog(name, clean);

  try {
    /* 1. Clarity: the event name, plus each dimension as a filterable tag. */
    clarityEvent(name);
    claritySetTag("last_event", name);
    for (const [key, value] of Object.entries(clean)) claritySetTag(key, value);
    if (UPGRADE_ON.has(name)) clarityUpgrade(name);

    /* 2. GTM-compatible data layer (works whether or not GTM is installed). */
    const w = window as FanOutWindow;
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push(payload);

    /* 3. Optional third parties, only if their scripts are on the page. */
    w.gtag?.("event", name, clean);
    w.plausible?.(name, { props: clean });

    /* 4. In-app listeners (kept for the pre-existing WhatsApp CTA hook). */
    window.dispatchEvent(new CustomEvent("fempower:analytics", { detail: payload }));
    window.dispatchEvent(new CustomEvent(`fempower:${name}`, { detail: payload }));
  } catch (err) {
    debugLog("fan-out failed", name, err);
  }

  /* 5. First-party persistence for the events the Northstar dashboard counts. */
  const engagementType = ENGAGEMENT_BRIDGE[name];
  if (engagementType) {
    const targetId = typeof props.target_id === "string" ? props.target_id : null;
    void logEngagement(engagementType, targetId, clean);
  }
};

/** Convenience wrapper so callers can `onClick={trackClick("join_cta_click", …)}`. */
export const trackClick =
  (name: AnalyticsEventName, props: AnalyticsProps = {}) =>
  (): void =>
    track(name, props);

/* ------------------------------------------------------------------ *
 * Page views
 * ------------------------------------------------------------------ */

/** Records a SPA route change. Repeat calls for the same path are ignored. */
export const trackPageView = (pathname: string, search = ""): void => {
  if (!isBrowser()) return;
  const path = redactPath(pathname, search);
  if (path === currentPath) return;
  currentPath = path;

  const section = sectionForPath(pathname);
  claritySetTag("page_path", path);
  claritySetTag("app_section", section);

  track("page_view", {
    path,
    section,
    title: document.title,
    session_id: getSessionId(),
    ...readCampaignParams(search),
  });
};

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

export interface MemberIdentity {
  /** Supabase user UUID — pseudonymous, and the key we already join on. */
  userId: string;
  /** `google`, `email`, … from `app_metadata.provider`. */
  provider?: string | null;
  /** ISO timestamp of account creation, used for an account-age bucket. */
  createdAt?: string | null;
}

/**
 * Links the current replay to a member. Only the UUID is sent — never an
 * email or display name, which Clarity would surface in plain text.
 */
export const identifyMember = ({ userId, provider, createdAt }: MemberIdentity): void => {
  if (!isBrowser() || !userId) return;
  ensureInitialised();
  if (!isTrackingAllowed()) return;
  clarityIdentify(userId, { sessionId: getSessionId(), pageId: currentPath || undefined });
  claritySetTag("auth_state", "authenticated");
  if (provider) claritySetTag("auth_provider", provider);
  if (createdAt) {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
    if (Number.isFinite(days) && days >= 0) claritySetTag("account_age_days", days);
  }
};

/** Tags the replay with membership context once a page has loaded the profile. */
export const setMemberContext = (ctx: {
  status?: string | null;
  isAdmin?: boolean;
}): void => {
  if (!isBrowser()) return;
  ensureInitialised();
  if (ctx.status) claritySetTag("member_status", ctx.status);
  if (typeof ctx.isAdmin === "boolean") claritySetTag("is_admin", ctx.isAdmin);
};

/** Marks the session anonymous again after sign-out. */
export const resetIdentity = (): void => {
  claritySetTag("auth_state", "anonymous");
  claritySetTag("member_status", "none");
  claritySetTag("is_admin", false);
};

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/**
 * Reports a caught failure. Message text is scrubbed and truncated, and the
 * session is upgraded so the replay is always available to watch back.
 */
export const trackError = (
  error: unknown,
  context: AnalyticsProps = {},
): void => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  claritySetTag("had_error", true);
  track("app_error", {
    message: scrubText(message),
    name: error instanceof Error ? error.name : "Unknown",
    path: isBrowser() ? redactPath(window.location.pathname, window.location.search) : "",
    ...context,
  });
};
