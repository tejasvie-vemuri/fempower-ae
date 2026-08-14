/**
 * Core Web Vitals, measured with `PerformanceObserver` and no extra dependency.
 *
 * The public pages are prerendered specifically so search engines and AI
 * assistants can read them, which makes field performance a ranking input
 * rather than a nice-to-have. These numbers land in Clarity as `web_vital`
 * events, so a slow LCP can be filtered straight into the matching replays.
 *
 * Values are collected as they arrive and reported once, when the page is
 * backgrounded — that's the only moment LCP, CLS and INP are actually final.
 */

import { track } from "./index";
import { isBrowser } from "./config";

type VitalName = "LCP" | "CLS" | "INP" | "FID" | "FCP" | "TTFB";

/** Google's published good / needs-improvement thresholds, in ms (CLS: score). */
const THRESHOLDS: Record<VitalName, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FID: [100, 300],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

const rate = (name: VitalName, value: number): string => {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  return value <= poor ? "needs-improvement" : "poor";
};

const values = new Map<VitalName, number>();
const reported = new Set<VitalName>();
const observers: PerformanceObserver[] = [];
let started = false;

const record = (name: VitalName, value: number) => {
  if (!Number.isFinite(value) || value < 0) return;
  values.set(name, value);
};

const observe = (
  type: string,
  callback: (entries: PerformanceEntry[]) => void,
  extra: PerformanceObserverInit = {},
) => {
  try {
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
    observers.push(observer);
  } catch {
    /* entry type unsupported in this browser — skip that vital */
  }
};

/** Sends everything collected so far, once per metric per page load. */
const report = (reason: string) => {
  for (const [name, value] of values.entries()) {
    if (reported.has(name)) continue;
    reported.add(name);
    track("web_vital", {
      metric: name,
      value: name === "CLS" ? Math.round(value * 1000) / 1000 : Math.round(value),
      rating: rate(name, value),
      path: window.location.pathname,
      reason,
    });
  }
};

/**
 * Starts collecting. Idempotent, and a no-op where `PerformanceObserver` is
 * missing. Returns a cleanup function that disconnects the observers.
 */
export const startWebVitals = (): (() => void) => {
  if (!isBrowser() || started || typeof PerformanceObserver === "undefined") return () => {};
  started = true;

  /* TTFB — available immediately from the navigation entry. */
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav) record("TTFB", nav.responseStart);
  } catch {
    /* navigation timing unavailable */
  }

  /* FCP */
  observe("paint", (entries) => {
    for (const entry of entries) {
      if (entry.name === "first-contentful-paint") record("FCP", entry.startTime);
    }
  });

  /* LCP — keep the latest candidate; it only grows until interaction. */
  observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) record("LCP", last.startTime);
  });

  /* CLS — sum of unexpected shifts (input-driven shifts don't count). */
  observe("layout-shift", (entries) => {
    let total = values.get("CLS") ?? 0;
    for (const entry of entries as (PerformanceEntry & {
      value: number;
      hadRecentInput: boolean;
    })[]) {
      if (!entry.hadRecentInput) total += entry.value;
    }
    record("CLS", total);
  });

  /* FID — first input delay, from the dedicated entry type. */
  observe("first-input", (entries) => {
    const first = entries[0] as (PerformanceEntry & { processingStart: number }) | undefined;
    if (first) record("FID", first.processingStart - first.startTime);
  });

  /* INP — approximated as the slowest qualifying interaction on the page. */
  observe(
    "event",
    (entries) => {
      let worst = values.get("INP") ?? 0;
      for (const entry of entries as (PerformanceEntry & { interactionId?: number })[]) {
        if (!entry.interactionId) continue;
        if (entry.duration > worst) worst = entry.duration;
      }
      if (worst) record("INP", worst);
    },
    { durationThreshold: 40 } as PerformanceObserverInit,
  );

  const onHidden = () => {
    if (document.visibilityState === "hidden") report("hidden");
  };
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", () => report("pagehide"));

  return () => {
    observers.forEach((o) => o.disconnect());
    observers.length = 0;
    document.removeEventListener("visibilitychange", onHidden);
    started = false;
  };
};
