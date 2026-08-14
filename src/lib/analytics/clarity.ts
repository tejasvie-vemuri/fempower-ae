/**
 * Microsoft Clarity — lazy loader and typed wrapper.
 *
 * Clarity gives us session replays, heatmaps, rage/dead-click detection and
 * filterable custom events for free. The tag is injected on the first idle
 * callback rather than in <head>, because the public pages are prerendered for
 * SEO and we don't want a third-party script competing with LCP.
 *
 * Every export here is a safe no-op when Clarity isn't configured, when the
 * visitor has opted out, or during the SSR prerender pass.
 */

import {
  CLARITY_PROJECT_ID,
  debugLog,
  isBrowser,
  isClarityConfigured,
  isTrackingAllowed,
  scrubText,
} from "./config";

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

const TAG_SRC = "https://www.clarity.ms/tag/";
const SCRIPT_ID = "fempower-clarity";

let loadRequested = false;

/** Mirrors the official snippet's queue stub so calls made pre-load survive. */
const installQueueStub = (): void => {
  if (window.clarity) return;
  const stub: ClarityFn = function (this: unknown) {
    // eslint-disable-next-line prefer-rest-params
    (stub.q = stub.q || []).push(arguments);
  };
  window.clarity = stub;
};

const injectTag = (): void => {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `${TAG_SRC}${encodeURIComponent(CLARITY_PROJECT_ID)}`;
  script.addEventListener("error", () => {
    // Ad blockers routinely kill this request. Not an app error — just log it
    // in debug mode so nobody spends an afternoon wondering where replays went.
    debugLog("Clarity tag failed to load (blocked or offline)");
  });
  document.head.appendChild(script);
  debugLog("Clarity tag injected", CLARITY_PROJECT_ID);
};

const whenIdle = (fn: () => void): void => {
  const ric = (window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;
  if (typeof ric === "function") ric(fn, { timeout: 4000 });
  else window.setTimeout(fn, 1500);
};

/**
 * Boots Clarity. Idempotent — safe to call from React StrictMode double-effects.
 * Returns whether the tag was actually requested.
 */
export const initClarity = (): boolean => {
  if (!isBrowser() || loadRequested) return loadRequested;
  if (!isClarityConfigured()) {
    debugLog("Clarity disabled: VITE_CLARITY_PROJECT_ID is not set");
    return false;
  }
  if (!isTrackingAllowed()) {
    debugLog("Clarity disabled: visitor opted out or running on localhost");
    return false;
  }
  loadRequested = true;
  installQueueStub();
  whenIdle(injectTag);
  return true;
};

/** Low-level escape hatch. Prefer the named helpers below. */
export const clarityCall = (...args: unknown[]): void => {
  if (!isBrowser() || !isTrackingAllowed()) return;
  const clarity = window.clarity;
  if (typeof clarity !== "function") return;
  try {
    clarity(...args);
  } catch (err) {
    debugLog("Clarity call failed", args[0], err);
  }
};

/**
 * Names a custom event in the Clarity dashboard. Clarity only accepts the
 * event name (no payload) — dimensions go through {@link claritySetTag}.
 */
export const clarityEvent = (name: string): void => {
  if (!name) return;
  clarityCall("event", name.slice(0, 100));
};

/**
 * Attaches a filterable tag to the current session and page. Values are
 * coerced to strings because Clarity stores tags as string (or string[]).
 */
export const claritySetTag = (key: string, value: string | number | boolean | string[]): void => {
  if (!key) return;
  const clean = Array.isArray(value)
    ? value.slice(0, 10).map((v) => scrubText(String(v)).slice(0, 255))
    : scrubText(String(value)).slice(0, 255);
  if (!clean || (Array.isArray(clean) && clean.length === 0)) return;
  clarityCall("set", key.slice(0, 100), clean);
};

/**
 * Links the replay to a stable identifier. We pass the Supabase user UUID —
 * pseudonymous and already the key we join on internally. Never pass an email
 * or display name: Clarity surfaces the friendly-name argument in plain text.
 */
export const clarityIdentify = (
  customId: string,
  opts: { sessionId?: string; pageId?: string } = {},
): void => {
  if (!customId) return;
  clarityCall("identify", customId, opts.sessionId, opts.pageId);
};

/**
 * Guarantees the current session is recorded (Clarity samples by default).
 * Reserve this for moments we always want to watch back: checkout, a failed
 * registration, an unhandled error.
 */
export const clarityUpgrade = (reason: string): void => {
  clarityCall("upgrade", reason.slice(0, 100));
};

/**
 * Grants or revokes Clarity's cookie consent. Clarity defaults to consented;
 * call this with `false` when a visitor declines and we still want the tag
 * loaded in cookieless mode.
 */
export const claritySetConsent = (granted: boolean): void => {
  clarityCall("consent", granted);
};
