/**
 * Zero-config behavioural capture.
 *
 * Mounted once by <Analytics />, this attaches a handful of delegated,
 * passive listeners to `document` so we get the boring-but-essential signals
 * without sprinkling onClick handlers through 190 components:
 *
 *   - outbound link clicks, with WhatsApp / Instagram / LinkedIn / Substack
 *     recognised as their own funnel events
 *   - declarative tracking via `data-analytics-event` attributes
 *   - scroll depth milestones and time-on-page per route
 *   - section visibility on the long marketing pages
 *   - unhandled errors and promise rejections
 *   - form submissions (name/id only — never field values)
 */

import { track, trackError } from "./index";
import type { AnalyticsEventName } from "./events";
import { isBrowser } from "./config";

const SCROLL_MILESTONES = [25, 50, 75, 90, 100] as const;
const DOWNLOAD_EXT = /\.(pdf|docx?|xlsx?|pptx?|csv|zip|ics|png|jpe?g|mp4|mp3)$/i;

let pageStartedAt = 0;
let maxScroll = 0;
let firedMilestones = new Set<number>();
let activePath = "";
let sectionObserver: IntersectionObserver | null = null;
const seenSections = new Set<string>();

/* ------------------------------------------------------------------ *
 * Link classification
 * ------------------------------------------------------------------ */

const eventForHost = (host: string): AnalyticsEventName | null => {
  if (/(^|\.)wa\.me$/.test(host) || /whatsapp\.com$/.test(host)) return "whatsapp_cta_click";
  if (/instagram\.com$/.test(host)) return "instagram_click";
  if (/linkedin\.com$/.test(host)) return "linkedin_click";
  if (/substack\.com$/.test(host)) return "substack_click";
  return null;
};

/** Human-readable label for a clicked element, with any PII already scrubbed downstream. */
const labelFor = (el: HTMLElement): string =>
  (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);

/** Collects `data-analytics-*` attributes (minus `-event`) as event props. */
const declarativeProps = (el: HTMLElement): Record<string, string> => {
  const props: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (!attr.name.startsWith("data-analytics-") || attr.name === "data-analytics-event") continue;
    props[attr.name.replace("data-analytics-", "").replace(/-/g, "_")] = attr.value;
  }
  return props;
};

const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (!target || typeof target.closest !== "function") return;

  // 1. Explicit opt-in wins: <button data-analytics-event="join_cta_click" …>
  const declared = target.closest<HTMLElement>("[data-analytics-event]");
  if (declared) {
    const name = declared.getAttribute("data-analytics-event") as AnalyticsEventName;
    if (name) {
      track(name, {
        label: labelFor(declared),
        path: window.location.pathname,
        ...declarativeProps(declared),
      });
    }
  }

  // 2. Anything leaving the site.
  const anchor = target.closest("a");
  if (!anchor) return;
  const href = anchor.getAttribute("href") ?? "";
  if (!href || href.startsWith("#")) return;

  const label = labelFor(anchor);
  const base = { label, path: window.location.pathname, location: anchor.dataset.location };

  if (href.startsWith("mailto:")) {
    track("outbound_click", { ...base, kind: "email" });
    return;
  }
  if (href.startsWith("tel:")) {
    track("outbound_click", { ...base, kind: "phone" });
    return;
  }

  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return;
  }
  if (!/^https?:$/.test(url.protocol)) return;

  if (anchor.hasAttribute("download") || DOWNLOAD_EXT.test(url.pathname)) {
    track("download_clicked", { ...base, file: url.pathname.split("/").pop() ?? "" });
    return;
  }

  if (url.hostname === window.location.hostname) return; // internal → covered by page_view

  const named = eventForHost(url.hostname);
  track(named ?? "outbound_click", {
    ...base,
    domain: url.hostname,
    target_path: url.pathname,
  });
};

/* ------------------------------------------------------------------ *
 * Scroll depth
 * ------------------------------------------------------------------ */

let scrollFrame = 0;

const measureScroll = () => {
  scrollFrame = 0;
  const doc = document.documentElement;
  const pageHeight = Math.max(doc.scrollHeight, document.body?.scrollHeight ?? 0);
  const viewportHeight = window.innerHeight || doc.clientHeight;
  const scrollable = pageHeight - viewportHeight;
  // A page shorter than the viewport is fully read the moment it renders; a
  // viewport we can't measure is not evidence of that, so report nothing.
  if (viewportHeight <= 0) return;
  const percent =
    scrollable <= 0 ? 100 : Math.min(100, Math.round(((window.scrollY || 0) / scrollable) * 100));
  if (percent > maxScroll) maxScroll = percent;
  for (const milestone of SCROLL_MILESTONES) {
    if (percent >= milestone && !firedMilestones.has(milestone)) {
      firedMilestones.add(milestone);
      track("scroll_depth", { depth: milestone, path: activePath });
    }
  }
};

const handleScroll = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(measureScroll);
};

/* ------------------------------------------------------------------ *
 * Time on page
 * ------------------------------------------------------------------ */

/** Emits how long the visitor spent on `activePath` and how far they read. */
const flushEngagement = (reason: string) => {
  if (!pageStartedAt || !activePath) return;
  const seconds = Math.round((Date.now() - pageStartedAt) / 1000);
  if (seconds < 1) return;
  track("page_engagement", { path: activePath, seconds, max_scroll: maxScroll, reason });
  pageStartedAt = Date.now(); // avoid double-counting if the tab is revisited
};

const handleVisibility = () => {
  if (document.visibilityState === "hidden") flushEngagement("hidden");
};

const handlePageHide = () => flushEngagement("pagehide");

/* ------------------------------------------------------------------ *
 * Section visibility
 * ------------------------------------------------------------------ */

/**
 * Fires `section_view` the first time each `<section id>` (or any element
 * carrying `data-analytics-section`) is half-visible. On a page as long as the
 * homepage this is the difference between "they bounced" and "they read to the
 * events calendar and stopped".
 */
const observeSections = () => {
  if (!("IntersectionObserver" in window)) return;
  sectionObserver?.disconnect();
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const name = el.dataset.analyticsSection || el.id;
        const key = `${activePath}#${name}`;
        if (!name || seenSections.has(key)) continue;
        seenSections.add(key);
        track("section_view", { section_id: name, path: activePath });
        sectionObserver?.unobserve(el);
      }
    },
    { threshold: 0.5 },
  );
  document
    .querySelectorAll<HTMLElement>("section[id], [data-analytics-section]")
    .forEach((el) => sectionObserver?.observe(el));
};

/* ------------------------------------------------------------------ *
 * Errors & forms
 * ------------------------------------------------------------------ */

const handleError = (e: ErrorEvent) => {
  trackError(e.error ?? e.message, {
    source: "window.onerror",
    file: (e.filename ?? "").split("/").pop(),
    line: e.lineno,
  });
};

const handleRejection = (e: PromiseRejectionEvent) => {
  trackError(e.reason, { source: "unhandledrejection" });
};

/**
 * Forms opt in with `data-analytics-form="newsletter"`. Opt-in rather than
 * blanket capture, so a form with its own funnel events (auth, event
 * registration) isn't also reported as a generic submission.
 */
const handleSubmit = (e: Event) => {
  const form = e.target as HTMLFormElement | null;
  if (!form || form.tagName !== "FORM") return;
  const name = form.getAttribute("data-analytics-form");
  if (!name) return;
  // Identity only — field values never leave the page.
  track("form_submitted", {
    form: name,
    path: window.location.pathname,
    fields: form.elements.length,
  });
};

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/** Attaches every listener. Returns a cleanup function. */
export const startAutoCapture = (): (() => void) => {
  if (!isBrowser()) return () => {};

  document.addEventListener("click", handleClick, { capture: true, passive: true });
  document.addEventListener("submit", handleSubmit, { capture: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);

  return () => {
    document.removeEventListener("click", handleClick, { capture: true } as EventListenerOptions);
    document.removeEventListener("submit", handleSubmit, { capture: true } as EventListenerOptions);
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    sectionObserver?.disconnect();
    sectionObserver = null;
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  };
};

/**
 * Called by <Analytics /> on every route change: closes out the previous
 * page's engagement, resets the per-page counters and re-scans for sections.
 */
export const notifyRouteChange = (path: string): void => {
  if (!isBrowser()) return;
  if (activePath && activePath !== path) flushEngagement("navigation");
  activePath = path;
  pageStartedAt = Date.now();
  maxScroll = 0;
  firedMilestones = new Set();
  // Let the new route paint before looking for its sections.
  window.setTimeout(observeSections, 350);
};
