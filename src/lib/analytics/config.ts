/**
 * Shared configuration, privacy gates and PII scrubbing for the analytics layer.
 *
 * Every other module in `@/lib/analytics` goes through this file, so the rules
 * about *when* we are allowed to track and *what* we are allowed to send live
 * in exactly one place. That matters here: Fempower stores member data under
 * the UAE PDPL, and session-replay tooling (Microsoft Clarity) is the easiest
 * way in the world to accidentally ship someone's email address to a vendor.
 */

const env = import.meta.env as unknown as Record<string, string | undefined>;

const isTruthy = (value?: string): boolean => {
  const v = (value ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
};

/** Microsoft Clarity project id. Empty in dev/preview → Clarity never loads. */
export const CLARITY_PROJECT_ID = (env.VITE_CLARITY_PROJECT_ID ?? "").trim();

/**
 * Legacy `DNT` is opt-in because several browsers send it by default, which
 * would silently zero out our analytics. Global Privacy Control is always
 * honoured (see `hasOptedOutOfTracking`).
 */
const RESPECT_DO_NOT_TRACK = isTruthy(env.VITE_ANALYTICS_RESPECT_DNT);

/** Set to `true` locally when you actually want to smoke-test the pipeline. */
const ALLOW_ON_LOCALHOST = isTruthy(env.VITE_ANALYTICS_ALLOW_LOCALHOST);

/** localStorage key backing the member-facing "stop tracking me" switch. */
export const OPT_OUT_STORAGE_KEY = "fempower:analytics-opt-out";

export const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

/** `?analytics_debug` on any URL, or VITE_ANALYTICS_DEBUG at build time. */
export const isDebugEnabled = (): boolean => {
  if (isTruthy(env.VITE_ANALYTICS_DEBUG)) return true;
  if (!isBrowser()) return false;
  try {
    return new URLSearchParams(window.location.search).has("analytics_debug");
  } catch {
    return false;
  }
};

export const debugLog = (...args: unknown[]): void => {
  if (!isDebugEnabled()) return;
  console.debug("[analytics]", ...args);
};

const isLocalHost = (): boolean => {
  if (!isBrowser()) return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    h.endsWith(".local")
  );
};

/**
 * True when the visitor has asked not to be tracked. Checked on every call
 * rather than cached, so flipping the switch takes effect immediately.
 */
export const hasOptedOutOfTracking = (): boolean => {
  if (!isBrowser()) return true;
  const nav = navigator as Navigator & {
    globalPrivacyControl?: boolean;
    doNotTrack?: string | null;
    msDoNotTrack?: string | null;
  };
  if (nav.globalPrivacyControl === true) return true;
  if (RESPECT_DO_NOT_TRACK) {
    const dnt =
      nav.doNotTrack ??
      (window as unknown as { doNotTrack?: string }).doNotTrack ??
      nav.msDoNotTrack;
    if (dnt === "1" || dnt === "yes") return true;
  }
  try {
    return window.localStorage.getItem(OPT_OUT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

/** Member-facing opt-out (PDPL right to object). Persists across sessions. */
export const setTrackingOptOut = (optedOut: boolean): void => {
  if (!isBrowser()) return;
  try {
    if (optedOut) window.localStorage.setItem(OPT_OUT_STORAGE_KEY, "1");
    else window.localStorage.removeItem(OPT_OUT_STORAGE_KEY);
  } catch {
    /* storage disabled — nothing we can do, fail open to "tracked" */
  }
};

/**
 * The single gate every sink checks: browser present, visitor hasn't opted
 * out, and we're not polluting production dashboards from a dev machine.
 */
export const isTrackingAllowed = (): boolean => {
  if (!isBrowser()) return false;
  if (hasOptedOutOfTracking()) return false;
  if (isLocalHost() && !ALLOW_ON_LOCALHOST && !isDebugEnabled()) return false;
  return true;
};

export const isClarityConfigured = (): boolean => CLARITY_PROJECT_ID.length > 0;

/* ------------------------------------------------------------------ *
 * PII scrubbing
 * ------------------------------------------------------------------ */

export type AnalyticsValue = string | number | boolean;
export type AnalyticsProps = Record<string, unknown>;
export type CleanProps = Record<string, AnalyticsValue>;

/** Prop keys we refuse to forward, no matter what the caller passes. */
const BLOCKED_KEY = new RegExp(
  [
    "e?mail",
    "phone",
    "mobile",
    "whatsapp_?number",
    "password",
    "passwd",
    "secret",
    "token",
    "jwt",
    "otp",
    "api_?key",
    "access_?key",
    "session_?key",
    "address",
    "dob",
    "birth",
    "iban",
    "card",
    "cvv",
    "passport",
    "emirates_?id",
    "full_?name",
    "first_?name",
    "last_?name",
  ].join("|"),
  "i",
);

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;
const PHONE_RE = /(?:\+|00)?\d[\d\s().-]{7,}\d/g;

const MAX_STRING_LENGTH = 200;
const MAX_PROPS = 25;

/** Strips anything that looks like an email address or phone number. */
export const scrubText = (value: string): string =>
  value
    .replace(EMAIL_RE, "[email]")
    .replace(PHONE_RE, "[phone]")
    .slice(0, MAX_STRING_LENGTH);

/**
 * Normalises arbitrary caller props into flat, PII-free primitives.
 * Unknown/complex values are dropped rather than JSON-stringified — a nested
 * object is exactly where a member's profile row would sneak through.
 */
export const sanitizeProps = (props: AnalyticsProps = {}): CleanProps => {
  const out: CleanProps = {};
  for (const [rawKey, rawValue] of Object.entries(props)) {
    if (Object.keys(out).length >= MAX_PROPS) break;
    if (rawValue === null || rawValue === undefined) continue;
    const key = rawKey.trim().slice(0, 40);
    if (!key || BLOCKED_KEY.test(key)) continue;

    if (typeof rawValue === "string") {
      const v = scrubText(rawValue.trim());
      if (v) out[key] = v;
    } else if (typeof rawValue === "number") {
      if (Number.isFinite(rawValue)) out[key] = Math.round(rawValue * 100) / 100;
    } else if (typeof rawValue === "boolean") {
      out[key] = rawValue;
    }
    /* everything else (objects, arrays, functions) is intentionally dropped */
  }
  return out;
};

/** Query params that carry campaign intent and are safe to keep verbatim. */
const SAFE_QUERY_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "source",
  "slot",
  "tab",
  "gclid",
  "fbclid",
]);

/**
 * Turns a location into a reportable path. Auth tokens ride in the query
 * string and the hash on /reset-password, so unknown params are reduced to
 * their key and the hash is dropped entirely.
 */
export const redactPath = (pathname: string, search = ""): string => {
  let query = "";
  try {
    const params = new URLSearchParams(search);
    const parts: string[] = [];
    for (const [k, v] of params.entries()) {
      parts.push(SAFE_QUERY_KEYS.has(k) ? `${k}=${scrubText(v)}` : `${k}=[redacted]`);
    }
    if (parts.length) query = `?${parts.join("&")}`;
  } catch {
    query = "";
  }
  return `${pathname}${query}`.slice(0, MAX_STRING_LENGTH);
};

/** Campaign attribution for the current URL, if any. */
export const readCampaignParams = (search: string): CleanProps => {
  const out: CleanProps = {};
  try {
    const params = new URLSearchParams(search);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"]) {
      const v = params.get(key);
      if (v) out[key] = scrubText(v);
    }
  } catch {
    /* malformed query string — no attribution */
  }
  return out;
};
